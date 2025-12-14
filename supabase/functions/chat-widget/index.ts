import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const WIDGET_SCRIPT = `
(function() {
  'use strict';
  
  const API_BASE = '{{API_BASE}}';
  let config = null;
  let messages = [];
  let isOpen = false;
  let isLoading = false;
  
  // Create widget styles
  const styles = document.createElement('style');
  styles.textContent = \`
    .lv-widget-container * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .lv-widget-btn { position: fixed; bottom: 24px; right: 24px; width: 60px; height: 60px; border-radius: 50%; border: none; cursor: pointer; box-shadow: 0 4px 20px rgba(0,0,0,0.25); z-index: 99999; display: flex; align-items: center; justify-content: center; transition: transform 0.2s, box-shadow 0.2s; }
    .lv-widget-btn:hover { transform: scale(1.05); box-shadow: 0 6px 25px rgba(0,0,0,0.3); }
    .lv-widget-btn svg { width: 28px; height: 28px; fill: white; }
    .lv-widget-panel { position: fixed; bottom: 100px; right: 24px; width: 380px; max-width: calc(100vw - 48px); height: 520px; max-height: calc(100vh - 140px); background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); z-index: 99998; display: none; flex-direction: column; overflow: hidden; }
    .lv-widget-panel.open { display: flex; animation: lvSlideUp 0.3s ease; }
    @keyframes lvSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .lv-widget-header { padding: 16px 20px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #e5e7eb; }
    .lv-widget-logo { width: 40px; height: 40px; border-radius: 8px; object-fit: contain; background: #f3f4f6; }
    .lv-widget-title { font-size: 16px; font-weight: 600; color: #111; flex: 1; }
    .lv-widget-close { width: 32px; height: 32px; border: none; background: #f3f4f6; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .lv-widget-close:hover { background: #e5e7eb; }
    .lv-widget-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
    .lv-widget-msg { max-width: 85%; padding: 12px 16px; border-radius: 16px; font-size: 14px; line-height: 1.5; word-wrap: break-word; }
    .lv-widget-msg.user { align-self: flex-end; background: var(--lv-primary); color: white; border-bottom-right-radius: 4px; }
    .lv-widget-msg.assistant { align-self: flex-start; background: #f3f4f6; color: #111; border-bottom-left-radius: 4px; }
    .lv-widget-msg.typing { background: #f3f4f6; }
    .lv-widget-msg.typing::after { content: '...'; animation: lvDots 1.5s infinite; }
    @keyframes lvDots { 0%, 20% { content: '.'; } 40% { content: '..'; } 60%, 100% { content: '...'; } }
    .lv-widget-input-area { padding: 16px; border-top: 1px solid #e5e7eb; display: flex; gap: 8px; }
    .lv-widget-input { flex: 1; padding: 12px 16px; border: 1px solid #e5e7eb; border-radius: 24px; font-size: 14px; outline: none; transition: border-color 0.2s; }
    .lv-widget-input:focus { border-color: var(--lv-primary); }
    .lv-widget-send { width: 44px; height: 44px; border: none; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: opacity 0.2s; }
    .lv-widget-send:disabled { opacity: 0.5; cursor: not-allowed; }
    .lv-widget-send svg { width: 20px; height: 20px; fill: white; }
    .lv-widget-welcome { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  \`;
  document.head.appendChild(styles);
  
  // Create widget HTML
  const container = document.createElement('div');
  container.className = 'lv-widget-container';
  container.innerHTML = \`
    <button class="lv-widget-btn" id="lv-toggle">
      <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
    </button>
    <div class="lv-widget-panel" id="lv-panel">
      <div class="lv-widget-header">
        <img class="lv-widget-logo" id="lv-logo" src="" alt="">
        <span class="lv-widget-title" id="lv-title">Chat with us</span>
        <button class="lv-widget-close" id="lv-close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="lv-widget-messages" id="lv-messages">
        <div class="lv-widget-welcome" id="lv-welcome">Loading...</div>
      </div>
      <div class="lv-widget-input-area">
        <input class="lv-widget-input" id="lv-input" placeholder="Type a message..." />
        <button class="lv-widget-send" id="lv-send">
          <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    </div>
  \`;
  document.body.appendChild(container);
  
  const toggleBtn = document.getElementById('lv-toggle');
  const panel = document.getElementById('lv-panel');
  const closeBtn = document.getElementById('lv-close');
  const messagesEl = document.getElementById('lv-messages');
  const inputEl = document.getElementById('lv-input');
  const sendBtn = document.getElementById('lv-send');
  const logoEl = document.getElementById('lv-logo');
  const titleEl = document.getElementById('lv-title');
  const welcomeEl = document.getElementById('lv-welcome');
  
  // Get company slug from script tag
  const scriptTag = document.currentScript || document.querySelector('script[data-company]');
  const companySlug = scriptTag?.getAttribute('data-company') || '';
  
  if (!companySlug) {
    welcomeEl.textContent = 'Widget not configured';
    return;
  }
  
  // Load config
  fetch(API_BASE + '/widget-api?action=config&company=' + encodeURIComponent(companySlug))
    .then(r => r.json())
    .then(data => {
      if (data.error) throw new Error(data.error);
      config = data;
      
      // Apply branding
      const primary = config.company.primary_color || '#6366f1';
      document.documentElement.style.setProperty('--lv-primary', primary);
      toggleBtn.style.background = primary;
      sendBtn.style.background = primary;
      
      if (config.company.logo_url) {
        logoEl.src = config.company.logo_url;
        logoEl.style.display = 'block';
      } else {
        logoEl.style.display = 'none';
      }
      
      titleEl.textContent = config.company.name;
      welcomeEl.textContent = 'Hi! How can we help you today?';
    })
    .catch(err => {
      console.error('Widget config error:', err);
      welcomeEl.textContent = 'Unable to load chat';
    });
  
  // Toggle panel
  toggleBtn.addEventListener('click', () => {
    isOpen = !isOpen;
    panel.classList.toggle('open', isOpen);
    if (isOpen) inputEl.focus();
  });
  
  closeBtn.addEventListener('click', () => {
    isOpen = false;
    panel.classList.remove('open');
  });
  
  // Send message
  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text || isLoading || !config) return;
    
    inputEl.value = '';
    welcomeEl.style.display = 'none';
    
    // Add user message
    messages.push({ role: 'user', content: text });
    renderMessages();
    
    isLoading = true;
    sendBtn.disabled = true;
    
    // Add typing indicator
    const typingEl = document.createElement('div');
    typingEl.className = 'lv-widget-msg assistant typing';
    messagesEl.appendChild(typingEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    
    try {
      const response = await fetch(API_BASE + '/widget-api?action=chat&company=' + encodeURIComponent(companySlug), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });
      
      if (!response.ok) throw new Error('Chat failed');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              typingEl.classList.remove('typing');
              typingEl.textContent = assistantContent;
              messagesEl.scrollTop = messagesEl.scrollHeight;
            }
          } catch {}
        }
      }
      
      if (assistantContent) {
        messages.push({ role: 'assistant', content: assistantContent });
      }
      typingEl.remove();
      renderMessages();
      
    } catch (err) {
      console.error('Chat error:', err);
      typingEl.remove();
      messages.push({ role: 'assistant', content: 'Sorry, something went wrong. Please try again.' });
      renderMessages();
    } finally {
      isLoading = false;
      sendBtn.disabled = false;
    }
  }
  
  function renderMessages() {
    const msgHtml = messages.map(m => 
      '<div class="lv-widget-msg ' + m.role + '">' + escapeHtml(m.content) + '</div>'
    ).join('');
    messagesEl.innerHTML = msgHtml;
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
  
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  sendBtn.addEventListener('click', sendMessage);
  inputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
})();
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const apiBase = supabaseUrl + '/functions/v1';
    
    const script = WIDGET_SCRIPT.replace('{{API_BASE}}', apiBase);
    
    return new Response(script, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Widget script error:', error);
    return new Response('console.error("Widget failed to load");', {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/javascript' },
    });
  }
});
