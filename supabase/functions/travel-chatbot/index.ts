import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      console.log('LOVABLE_API_KEY not configured, returning mock response');
      return getMockChatResponse(messages);
    }

    console.log('Processing travel chatbot request with', messages.length, 'messages');

    // Call Lovable API for chatbot responses
    const response = await fetch('https://api.lovable.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful travel assistant for B-Reserve. Provide concise, helpful travel advice, booking assistance, and destination recommendations. Be friendly and professional.'
          },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable API error:', response.status, errorText);
      console.log('Falling back to mock response');
      return getMockChatResponse(messages);
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    return new Response(
      JSON.stringify({
        success: true,
        reply,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in travel-chatbot:', error);
    const { messages } = await req.json();
    return getMockChatResponse(messages);
  }
});

function getMockChatResponse(messages: any[]) {
  const lastMessage = messages[messages.length - 1]?.content || '';
  
  // Simple keyword-based mock responses
  let mockReply = "I'm here to help you with your travel needs! I can assist with flight bookings, hotel reservations, destination recommendations, and travel advice. What would you like to know?";
  
  const lowerMessage = lastMessage.toLowerCase();
  
  if (lowerMessage.includes('flight') || lowerMessage.includes('vol')) {
    mockReply = "I can help you find the best flights! Please provide your departure city, destination, travel dates, and number of passengers. I'll search for the most suitable options for you.";
  } else if (lowerMessage.includes('hotel') || lowerMessage.includes('hébergement')) {
    mockReply = "For hotel bookings, I'll need your destination, check-in and check-out dates, and the number of guests. I can recommend hotels based on your budget and preferences.";
  } else if (lowerMessage.includes('recommend') || lowerMessage.includes('conseil')) {
    mockReply = "I'd be happy to provide travel recommendations! Tell me about your interests, budget, and preferred travel style, and I'll suggest destinations and activities perfect for you.";
  } else if (lowerMessage.includes('price') || lowerMessage.includes('prix') || lowerMessage.includes('cost')) {
    mockReply = "Our prices vary based on destination, dates, and availability. I can help you find the best deals! Would you like me to search for specific routes or destinations?";
  } else if (lowerMessage.includes('cancel') || lowerMessage.includes('annuler')) {
    mockReply = "For booking modifications or cancellations, please provide your booking reference. I'll check the cancellation policy and assist you with the process.";
  } else if (lowerMessage.includes('hello') || lowerMessage.includes('bonjour') || lowerMessage.includes('hi')) {
    mockReply = "Hello! Welcome to B-Reserve travel assistance. How can I help you with your travel plans today?";
  }

  return new Response(
    JSON.stringify({
      success: true,
      reply: mockReply,
      source: 'mock'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
