import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // 1. Get User
        const { data: { user } } = await supabase.auth.getUser();

        // 2. Check for existing active or pending chat (not closed)
        if (user) {
            const { data: existingChat } = await supabase
                .from('support_chats')
                .select('*')
                .eq('user_id', user.id)
                .in('status', ['active', 'pending'])
                .single();

            if (existingChat) {
                return NextResponse.json({
                    success: true,
                    data: existingChat
                });
            }
        }

        // 3. Create New Chat
        const { data: chat, error } = await supabase
            .from('support_chats')
            .insert({
                user_id: user?.id || null,
                status: 'pending', // Waiting for admin
                // visitor_id: ... // Implement cookie logic if needed
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating chat:", error);
            return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
        }

        // 4. Send Initial System Message
        await supabase.from('support_messages').insert({
            chat_id: chat.id,
            sender_type: 'bot',
            content: "Un agent va bientôt vous répondre. Veuillez patienter...",
        });

        return NextResponse.json({
            success: true,
            data: chat
        });

    } catch (error) {
        return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
    }
}
