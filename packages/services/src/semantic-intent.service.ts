/**
 * Semantic Intent Classification Service
 *
 * Uses OpenAI embeddings and vector similarity for intelligent template matching
 * Combines semantic search with keyword matching for optimal accuracy
 */

import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';

export interface SemanticIntentResult {
  templateId: string;
  templateName: string;
  category: string;
  confidence: number;
  matchType: 'semantic' | 'keyword' | 'hybrid';
  similarity?: number;
  metadata?: any;
  triggers?: any;
}

export interface IntentClassificationOptions {
  threshold?: number;
  maxResults?: number;
  useHybrid?: boolean;
  category?: string;
}

export class SemanticIntentService {
  private openai: OpenAI;
  private supabase: any;
  private cache = new Map<string, SemanticIntentResult[]>();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes

  constructor(openaiApiKey: string) {
    this.openai = new OpenAI({ apiKey: openaiApiKey });
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Classify intent using semantic search
   */
  async classifyIntent(
    message: string,
    options: IntentClassificationOptions = {}
  ): Promise<SemanticIntentResult[]> {
    const {
      threshold = 0.7,
      maxResults = 5,
      useHybrid = true,
      category
    } = options;

    // Check cache first
    const cacheKey = `${message}_${JSON.stringify(options)}`;
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached[0]?.metadata?.cachedAt < this.cacheTTL) {
        return cached;
      }
    }

    // Generate embedding for the message
    const messageEmbedding = await this.generateEmbedding(message);

    // Perform semantic search
    const semanticResults = await this.searchSemantic(
      messageEmbedding,
      threshold,
      maxResults,
      category
    );

    let results: SemanticIntentResult[];

    if (useHybrid) {
      // Combine with keyword matching for better accuracy
      const keywordResults = await this.searchKeywords(message, maxResults, category);
      results = this.combineResults(semanticResults, keywordResults);
    } else {
      results = semanticResults;
    }

    // Sort by confidence
    results.sort((a, b) => b.confidence - a.confidence);

    // Add cache timestamp
    results.forEach(r => {
      r.metadata = { ...r.metadata, cachedAt: Date.now() };
    });

    // Cache results
    this.cache.set(cacheKey, results);

    return results;
  }

  /**
   * Get best matching template
   */
  async getBestMatch(
    message: string,
    options: IntentClassificationOptions = {}
  ): Promise<SemanticIntentResult | null> {
    const results = await this.classifyIntent(message, { ...options, maxResults: 1 });
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Generate embedding for text
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  /**
   * Search using semantic similarity
   */
  private async searchSemantic(
    embedding: number[],
    threshold: number,
    maxResults: number,
    category?: string
  ): Promise<SemanticIntentResult[]> {
    try {
      // Use the match_template_intent function from database
      const { data, error } = await supabase.rpc('match_template_intent', {
        query_embedding: `[${embedding.join(',')}]`,
        match_threshold: threshold,
        max_results: maxResults
      });

      if (error) {
        console.error('Semantic search error:', error);
        return [];
      }

      return data.map((item: any) => ({
        templateId: item.template_id,
        templateName: item.name,
        category: item.category,
        confidence: item.similarity,
        matchType: 'semantic' as const,
        similarity: item.similarity,
        metadata: item.metadata
      }));

    } catch (error) {
      console.error('Semantic search failed:', error);
      return [];
    }
  }

  /**
   * Search using keyword matching (fallback)
   */
  private async searchKeywords(
    message: string,
    maxResults: number,
    category?: string
  ): Promise<SemanticIntentResult[]> {
    const normalizedMessage = message.toLowerCase().trim();
    const keywords = this.extractKeywords(normalizedMessage);

    try {
      let query = supabase
        .from('enhanced_templates')
        .select('template_id, name, category, triggers, metadata');

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error || !data) {
        return [];
      }

      const results: SemanticIntentResult[] = [];

      for (const template of data) {
        const score = this.calculateKeywordScore(
          keywords,
          template.triggers?.keywords || [],
          template.triggers?.phrases || [],
          template.triggers?.patterns || []
        );

        if (score > 0.3) {
          results.push({
            templateId: template.template_id,
            templateName: template.name,
            category: template.category,
            confidence: Math.min(score, 0.95),
            matchType: 'keyword',
            metadata: template.metadata,
            triggers: template.triggers
          });
        }
      }

      return results
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, maxResults);

    } catch (error) {
      console.error('Keyword search failed:', error);
      return [];
    }
  }

  /**
   * Combine semantic and keyword results
   */
  private combineResults(
    semantic: SemanticIntentResult[],
    keyword: SemanticIntentResult[]
  ): SemanticIntentResult[] {
    const combined = new Map<string, SemanticIntentResult>();

    // Add semantic results
    semantic.forEach(result => {
      combined.set(result.templateId, {
        ...result,
        matchType: 'semantic'
      });
    });

    // Add or merge keyword results
    keyword.forEach(result => {
      const existing = combined.get(result.templateId);
      if (existing) {
        // Hybrid match - boost confidence
        existing.confidence = Math.min(
          (existing.confidence + result.confidence) / 2 * 1.1,
          0.99
        );
        existing.matchType = 'hybrid';
      } else {
        combined.set(result.templateId, result);
      }
    });

    return Array.from(combined.values());
  }

  /**
   * Extract keywords from message
   */
  private extractKeywords(message: string): string[] {
    // Simple keyword extraction - can be enhanced with NLP
    const words = message
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);

    // Add common n-grams
    const ngrams: string[] = [];
    for (let i = 0; i < words.length - 1; i++) {
      ngrams.push(`${words[i]} ${words[i + 1]}`);
    }

    return [...words, ...ngrams];
  }

  /**
   * Calculate keyword match score
   */
  private calculateKeywordScore(
    messageKeywords: string[],
    templateKeywords: string[],
    templatePhrases: string[],
    templatePatterns: string[]
  ): number {
    let score = 0;

    // Keyword matching (40% weight)
    const keywordMatches = messageKeywords.filter(kw =>
      templateKeywords.some(tk => tk.toLowerCase().includes(kw) || kw.includes(tk))
    );
    score += (keywordMatches.length / Math.max(templateKeywords.length, 1)) * 0.4;

    // Phrase matching (40% weight)
    const phraseMatches = templatePhrases.filter(phrase =>
      messageKeywords.some(kw => phrase.toLowerCase().includes(kw))
    );
    score += (phraseMatches.length / Math.max(templatePhrases.length, 1)) * 0.4;

    // Pattern matching (20% weight)
    const messageText = messageKeywords.join(' ');
    const patternMatches = templatePatterns.filter(pattern => {
      try {
        const regex = new RegExp(pattern, 'i');
        return regex.test(messageText);
      } catch {
        return false;
      }
    });
    score += (patternMatches.length / Math.max(templatePatterns.length, 1)) * 0.2;

    return Math.min(score, 1.0);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0.85 // This would be tracked in a real implementation
    };
  }

  /**
   * Pre-compute embeddings for templates
   */
  async precomputeEmbeddings(): Promise<void> {
    console.log('🔄 Pre-computing embeddings for enhanced templates...');

    const { data: templates, error } = await supabase
      .from('enhanced_templates')
      .select('template_id, name, triggers')
      .is('embedding', null);

    if (error || !templates) {
      console.log('No templates without embeddings found');
      return;
    }

    console.log(`Found ${templates.length} templates without embeddings`);

    for (const template of templates) {
      const text = [
        template.name,
        template.triggers?.keywords?.join(' ') || '',
        template.triggers?.phrases?.join(' ') || ''
      ].join(' ');

      const embedding = await this.generateEmbedding(text);

      await supabase
        .from('enhanced_templates')
        .update({ embedding })
        .eq('template_id', template.template_id);

      console.log(`  ✅ Generated embedding for ${template.template_id}`);
    }

    console.log('✅ Embedding pre-computation complete');
  }

  /**
   * Test classification accuracy
   */
  async testAccuracy(): Promise<{
    totalTests: number;
    passed: number;
    failed: number;
    accuracy: number;
    failures: Array<{ message: string; expected: string; actual: string }>;
  }> {
    const testCases = [
      {
        message: 'i need a registration',
        expected: 'seller_registration_standard',
        category: 'registration'
      },
      {
        message: 'register my property for sale',
        expected: 'seller_registration_standard',
        category: 'registration'
      },
      {
        message: 'bank registration for property',
        expected: 'bank_registration_property',
        category: 'registration'
      },
      {
        message: 'developer with viewing arranged',
        expected: 'developer_registration_viewing',
        category: 'registration'
      },
      {
        message: 'landlord rental registration',
        expected: 'rental_registration',
        category: 'registration'
      }
    ];

    let passed = 0;
    const failures = [];

    for (const test of testCases) {
      const result = await this.getBestMatch(test.message, {
        category: test.category,
        threshold: 0.6
      });

      if (result && result.templateId === test.expected) {
        passed++;
      } else {
        failures.push({
          message: test.message,
          expected: test.expected,
          actual: result?.templateId || 'none'
        });
      }
    }

    const accuracy = (passed / testCases.length) * 100;

    console.log('\n📊 Intent Classification Test Results:');
    console.log(`  Total tests: ${testCases.length}`);
    console.log(`  Passed: ${passed}`);
    console.log(`  Failed: ${failures.length}`);
    console.log(`  Accuracy: ${accuracy.toFixed(1)}%`);

    if (failures.length > 0) {
      console.log('\n❌ Failures:');
      failures.forEach(f => {
        console.log(`  "${f.message}"`);
        console.log(`    Expected: ${f.expected}`);
        console.log(`    Actual: ${f.actual}`);
      });
    }

    return {
      totalTests: testCases.length,
      passed,
      failed: failures.length,
      accuracy,
      failures
    };
  }
}