// Story 6.9: System Configuration API
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Validators for specific config keys
const validators: Record<string, (value: unknown) => boolean> = {
  openai_model: (value) =>
    typeof value === 'string' && ['gpt-4-turbo', 'gpt-4o', 'gpt-3.5-turbo'].includes(value),
  response_timeout_ms: (value) => typeof value === 'number' && value >= 1000 && value <= 60000,
  rate_limit_per_second: (value) => typeof value === 'number' && value > 0 && value <= 100,
  max_conversation_history: (value) => typeof value === 'number' && value > 0 && value <= 50,
  auto_archive_days: (value) => typeof value === 'number' && value > 0 && value <= 365,
  whatsapp_webhook_url: (value) => typeof value === 'string' && /^https?:\/\/.+/.test(value),
  telegram_webhook_url: (value) =>
    typeof value === 'string' && (value === '' || /^https?:\/\/.+/.test(value)),
};

// Validate config value
function validateConfigValue(key: string, value: unknown): boolean {
  const validator = validators[key];
  return validator ? validator(value) : true;
}

// GET /api/admin/config - Fetch all configuration
export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin user
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id, is_active')
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all config
    const { data: configs, error } = await supabase
      .from('system_config')
      .select('key, value, description, updated_at')
      .order('key');

    if (error) {
      console.error('Error fetching system config:', error);
      return NextResponse.json(
        { error: 'Failed to fetch configuration' },
        { status: 500 }
      );
    }

    // Parse JSON values
    const parsedConfigs = configs.map((config) => ({
      ...config,
      value: JSON.parse(config.value),
    }));

    return NextResponse.json({ configs: parsedConfigs });
  } catch (error) {
    console.error('Error in GET /api/admin/config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/config - Update configuration
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin user
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id, is_active')
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json(
        { error: 'Config key is required' },
        { status: 400 }
      );
    }

    // Validate config value
    if (!validateConfigValue(key, value)) {
      return NextResponse.json(
        { error: `Invalid value for config key: ${key}` },
        { status: 400 }
      );
    }

    // Update config
    const { data: updatedConfig, error } = await supabase
      .from('system_config')
      .update({
        value: JSON.stringify(value),
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('key', key)
      .select('key, value, description, updated_at')
      .single();

    if (error) {
      console.error('Error updating system config:', error);
      return NextResponse.json(
        { error: 'Failed to update configuration' },
        { status: 500 }
      );
    }

    // Parse JSON value
    const parsedConfig = {
      ...updatedConfig,
      value: JSON.parse(updatedConfig.value),
    };

    return NextResponse.json({ config: parsedConfig });
  } catch (error) {
    console.error('Error in PATCH /api/admin/config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
