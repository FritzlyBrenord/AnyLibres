import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const supabase = await createClient();
        const { content, sender_type = 'user' } = await request.json();
        const resolvedParams = await params;
        const chatId = resolvedParams.id;

        console.log('=== SUPPORT CHAT API DEBUG ===');
        console.log('Chat ID from params:', chatId);
        console.log('Content:', content);
        console.log('Sender type:', sender_type);

        if (!chatId) {
            console.error('ERROR: No chat_id received!');
            return NextResponse.json({ success: false, error: 'Missing chat_id' }, { status: 400 });
        }

        const { data: { user } } = await supabase.auth.getUser();
        console.log('User ID:', user?.id);

        // Insert Message
        const { data, error } = await supabase
            .from('support_messages')
            .insert({
                chat_id: chatId,
                sender_type: sender_type,
                sender_id: user?.id || null,
                content: content
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase insert error:', error);
            throw error;
        }

        console.log('Message inserted successfully:', data);
        return NextResponse.json({ success: true, data });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const supabase = await createClient();
        const resolvedParams = await params;
        const chatId = resolvedParams.id;

        const { data, error } = await supabase
            .from('support_messages')
            .select('*')
            .eq('chat_id', chatId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return NextResponse.json({ success: true, data });

    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}
