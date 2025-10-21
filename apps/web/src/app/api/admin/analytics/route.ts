/**
 * Admin Analytics API
 * Epic 6, Story 6.8: Analytics & Reporting
 *
 * Returns analytics data for charts and metrics
 */

import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';
import { tryCreateAdminClient } from '@/lib/supabase';

const supabase = tryCreateAdminClient();

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      console.error('[Analytics API] Supabase client unavailable');
      return NextResponse.json(
        { error: 'Service unavailable' },
        { status: 503 }
      );
    }

    // Check authentication
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get messages per day
    const { data: messages } = await supabase
      .from('conversation_logs')
      .select('timestamp')
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: true });

    const messagesPerDay: Record<string, number> = {};
    messages?.forEach((msg) => {
      const date = new Date(msg.timestamp).toISOString().split('T')[0];
      if (date) {
        messagesPerDay[date] = (messagesPerDay[date] || 0) + 1;
      }
    });

    const messagesChart = Object.entries(messagesPerDay).map(([date, count]) => ({
      date,
      count,
    }));

    // Get documents per week (simplified to per day for consistency)
    const { data: documents } = await supabase
      .from('document_generations')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    const documentsPerDay: Record<string, number> = {};
    documents?.forEach((doc) => {
      const date = new Date(doc.created_at).toISOString().split('T')[0];
      if (date) {
        documentsPerDay[date] = (documentsPerDay[date] || 0) + 1;
      }
    });

    const documentsChart = Object.entries(documentsPerDay).map(([date, count]) => ({
      date,
      count,
    }));

    // Get calculator uses per day
    const { data: calculators } = await supabase
      .from('calculator_history')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    const calculatorsPerDay: Record<string, number> = {};
    calculators?.forEach((calc) => {
      const date = new Date(calc.created_at).toISOString().split('T')[0];
      if (date) {
        calculatorsPerDay[date] = (calculatorsPerDay[date] || 0) + 1;
      }
    });

    const calculatorsChart = Object.entries(calculatorsPerDay).map(([date, count]) => ({
      date,
      count,
    }));

    // Get document types distribution
    const { data: docTypes } = await supabase
      .from('document_generations')
      .select('template_filename')
      .gte('created_at', startDate.toISOString());

    const documentTypesCount: Record<string, number> = {};
    docTypes?.forEach((doc) => {
      const type = doc.template_filename?.replace('.docx', '') || 'Unknown';
      documentTypesCount[type] = (documentTypesCount[type] || 0) + 1;
    });

    const documentTypes = Object.entries(documentTypesCount).map(([name, value]) => ({
      name,
      value,
    }));

    // Get calculator types distribution
    const { data: calcTypes } = await supabase
      .from('calculator_history')
      .select(`
        calculator_id,
        calculators (name)
      `)
      .gte('created_at', startDate.toISOString());

    const calculatorTypesCount: Record<string, number> = {};
    calcTypes?.forEach((calc) => {
      const calculator = calc.calculators as unknown as { name: string } | null;
      const name = calculator?.name || 'Unknown';
      calculatorTypesCount[name] = (calculatorTypesCount[name] || 0) + 1;
    });

    const calculatorTypes = Object.entries(calculatorTypesCount).map(([name, value]) => ({
      name,
      value,
    }));

    // Get top agents by activity
    const { data: agentActivity } = await supabase
      .from('conversation_logs')
      .select(`
        agent_id,
        agents (name)
      `)
      .gte('timestamp', startDate.toISOString());

    const agentActivityCount: Record<string, { name: string; count: number }> = {};
    agentActivity?.forEach((activity) => {
      const agent = activity.agents as unknown as { name: string } | null;
      const agentId = activity.agent_id;
      const agentName = agent?.name || 'Unknown';

      if (!agentActivityCount[agentId]) {
        agentActivityCount[agentId] = { name: agentName, count: 0 };
      }
      agentActivityCount[agentId].count++;
    });

    const topAgents = Object.values(agentActivityCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get performance metrics
    const { data: allMessages } = await supabase
      .from('conversation_logs')
      .select('timestamp')
      .gte('timestamp', startDate.toISOString());

    // Calculate peak hours (hour of day with most messages)
    const hourCounts: Record<number, number> = {};
    allMessages?.forEach((msg) => {
      const hour = new Date(msg.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakHour = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || '0';

    return NextResponse.json({
      messagesPerDay: messagesChart,
      documentsPerDay: documentsChart,
      calculatorsPerDay: calculatorsChart,
      documentTypes,
      calculatorTypes,
      topAgents,
      peakHour: parseInt(peakHour),
      totalMessages: messages?.length || 0,
      totalDocuments: documents?.length || 0,
      totalCalculators: calculators?.length || 0,
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
