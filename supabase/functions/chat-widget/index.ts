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
  let activeTab = 'chat';
  
  // Create widget styles
  const styles = document.createElement('style');
  styles.textContent = \`
    .lv-widget-container * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .lv-widget-btn { position: fixed; bottom: 24px; right: 24px; width: 60px; height: 60px; border-radius: 50%; border: none; cursor: pointer; box-shadow: 0 4px 20px rgba(0,0,0,0.25); z-index: 99999; display: flex; align-items: center; justify-content: center; transition: transform 0.2s, box-shadow 0.2s; }
    .lv-widget-btn:hover { transform: scale(1.05); box-shadow: 0 6px 25px rgba(0,0,0,0.3); }
    .lv-widget-btn svg { width: 28px; height: 28px; fill: white; }
    .lv-widget-panel { position: fixed; bottom: 100px; right: 24px; width: 400px; max-width: calc(100vw - 48px); height: 600px; max-height: calc(100vh - 140px); background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); z-index: 99998; display: none; flex-direction: column; overflow: hidden; }
    .lv-widget-panel.open { display: flex; animation: lvSlideUp 0.3s ease; }
    @keyframes lvSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .lv-widget-header { padding: 16px 20px; display: flex; align-items: center; gap: 12px; color: white; }
    .lv-widget-logo { width: 40px; height: 40px; border-radius: 8px; object-fit: contain; background: rgba(255,255,255,0.2); }
    .lv-widget-title { font-size: 16px; font-weight: 600; flex: 1; }
    .lv-widget-subtitle { font-size: 12px; opacity: 0.9; }
    .lv-widget-close { width: 32px; height: 32px; border: none; background: rgba(255,255,255,0.2); border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: white; }
    .lv-widget-close:hover { background: rgba(255,255,255,0.3); }
    .lv-widget-tabs { display: flex; border-bottom: 1px solid #e5e7eb; }
    .lv-widget-tab { flex: 1; padding: 12px; border: none; background: none; cursor: pointer; font-size: 13px; font-weight: 500; color: #6b7280; border-bottom: 2px solid transparent; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 6px; }
    .lv-widget-tab:hover { color: #111; }
    .lv-widget-tab.active { color: var(--lv-primary); border-bottom-color: var(--lv-primary); }
    .lv-widget-tab svg { width: 16px; height: 16px; }
    .lv-widget-content { flex: 1; overflow: hidden; display: none; flex-direction: column; }
    .lv-widget-content.active { display: flex; }
    .lv-widget-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
    .lv-widget-msg { max-width: 85%; padding: 12px 16px; border-radius: 16px; font-size: 14px; line-height: 1.5; word-wrap: break-word; }
    .lv-widget-msg.user { align-self: flex-end; background: var(--lv-primary); color: white; border-bottom-right-radius: 4px; }
    .lv-widget-msg.assistant { align-self: flex-start; background: #f3f4f6; color: #111; border-bottom-left-radius: 4px; }
    .lv-widget-msg.typing { background: #f3f4f6; }
    .lv-widget-msg.typing::after { content: '...'; animation: lvDots 1.5s infinite; }
    @keyframes lvDots { 0%, 20% { content: '.'; } 40% { content: '..'; } 60%, 100% { content: '...'; } }
    .lv-widget-welcome { text-align: center; padding: 20px; }
    .lv-widget-welcome-icon { width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; }
    .lv-widget-welcome-icon svg { width: 32px; height: 32px; fill: white; }
    .lv-widget-welcome h3 { font-size: 18px; font-weight: 600; margin: 0 0 8px; }
    .lv-widget-welcome p { font-size: 14px; color: #6b7280; margin: 0 0 20px; }
    .lv-widget-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 0 16px; }
    .lv-widget-action { padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
    .lv-widget-action:hover { border-color: var(--lv-primary); background: rgba(99, 102, 241, 0.05); }
    .lv-widget-action.emergency { border-color: #ef4444; color: #ef4444; }
    .lv-widget-action.emergency:hover { background: #fef2f2; }
    .lv-widget-action svg { width: 16px; height: 16px; flex-shrink: 0; }
    .lv-widget-input-area { padding: 16px; border-top: 1px solid #e5e7eb; display: flex; gap: 8px; }
    .lv-widget-input { flex: 1; padding: 12px 16px; border: 1px solid #e5e7eb; border-radius: 24px; font-size: 14px; outline: none; transition: border-color 0.2s; }
    .lv-widget-input:focus { border-color: var(--lv-primary); }
    .lv-widget-send { width: 44px; height: 44px; border: none; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: opacity 0.2s; }
    .lv-widget-send:disabled { opacity: 0.5; cursor: not-allowed; }
    .lv-widget-send svg { width: 20px; height: 20px; fill: white; }
    .lv-widget-services { padding: 16px; overflow-y: auto; }
    .lv-widget-service { padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s; }
    .lv-widget-service:hover { border-color: var(--lv-primary); }
    .lv-widget-service h4 { font-size: 14px; font-weight: 600; margin: 0 0 4px; }
    .lv-widget-service p { font-size: 12px; color: #6b7280; margin: 0; }
    .lv-widget-service-meta { display: flex; gap: 12px; margin-top: 8px; font-size: 12px; color: #6b7280; }
    .lv-widget-hours { padding: 16px; overflow-y: auto; }
    .lv-widget-today { padding: 16px; border-radius: 8px; margin-bottom: 16px; color: white; }
    .lv-widget-today h4 { font-size: 14px; font-weight: 500; margin: 0 0 4px; display: flex; align-items: center; gap: 8px; }
    .lv-widget-today p { font-size: 18px; font-weight: 600; margin: 0; }
    .lv-widget-schedule { }
    .lv-widget-schedule h4 { font-size: 14px; font-weight: 600; margin: 0 0 12px; }
    .lv-widget-day { display: flex; justify-content: space-between; padding: 10px 12px; border-radius: 6px; margin-bottom: 4px; font-size: 13px; }
    .lv-widget-day.today { background: rgba(99, 102, 241, 0.1); }
    .lv-widget-book-btn { width: 100%; padding: 12px; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 16px; color: white; }
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
      <div class="lv-widget-header" id="lv-header">
        <img class="lv-widget-logo" id="lv-logo" src="" alt="" style="display:none">
        <div>
          <div class="lv-widget-title" id="lv-title">Chat with us</div>
          <div class="lv-widget-subtitle">Virtual Assistant</div>
        </div>
        <button class="lv-widget-close" id="lv-close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="lv-widget-tabs">
        <button class="lv-widget-tab active" data-tab="chat">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
          Chat
        </button>
        <button class="lv-widget-tab" data-tab="services">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>
          Services
        </button>
        <button class="lv-widget-tab" data-tab="hours">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
          Hours
        </button>
      </div>
      <div class="lv-widget-content active" id="lv-content-chat">
        <div class="lv-widget-messages" id="lv-messages">
          <div class="lv-widget-welcome" id="lv-welcome">
            <div class="lv-widget-welcome-icon" id="lv-welcome-icon">
              <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
            </div>
            <h3>Hi there! 👋</h3>
            <p id="lv-welcome-text">Loading...</p>
          </div>
          <div class="lv-widget-actions" id="lv-actions" style="display:none">
            <button class="lv-widget-action" data-msg="I'd like to schedule an appointment">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>
              Book Appointment
            </button>
            <button class="lv-widget-action emergency" data-msg="I have an urgent emergency situation">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
              Emergency
            </button>
            <button class="lv-widget-action" data-msg="I need a quote for your services">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
              Get Quote
            </button>
            <button class="lv-widget-action" data-msg="What are your business hours?">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
              Hours
            </button>
            <button class="lv-widget-action" data-msg="What services do you offer?">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"/></svg>
              Services
            </button>
            <button class="lv-widget-action" data-msg="I want to track my appointment status">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              Track
            </button>
          </div>
        </div>
        <div class="lv-widget-input-area">
          <input class="lv-widget-input" id="lv-input" placeholder="Type a message..." />
          <button class="lv-widget-send" id="lv-send">
            <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
      </div>
      <div class="lv-widget-content" id="lv-content-services">
        <div class="lv-widget-services" id="lv-services-list"></div>
      </div>
      <div class="lv-widget-content" id="lv-content-hours">
        <div class="lv-widget-hours" id="lv-hours-list"></div>
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
  const headerEl = document.getElementById('lv-header');
  const logoEl = document.getElementById('lv-logo');
  const titleEl = document.getElementById('lv-title');
  const welcomeEl = document.getElementById('lv-welcome');
  const welcomeIconEl = document.getElementById('lv-welcome-icon');
  const welcomeTextEl = document.getElementById('lv-welcome-text');
  const actionsEl = document.getElementById('lv-actions');
  const servicesListEl = document.getElementById('lv-services-list');
  const hoursListEl = document.getElementById('lv-hours-list');
  const tabs = document.querySelectorAll('.lv-widget-tab');
  const contents = document.querySelectorAll('.lv-widget-content');
  
  // Get company slug from script tag
  const scriptTag = document.currentScript || document.querySelector('script[data-company]');
  const companySlug = scriptTag?.getAttribute('data-company') || '';
  
  if (!companySlug) {
    welcomeTextEl.textContent = 'Widget not configured';
    return;
  }
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  function formatTime(time) {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return formattedHour + ':' + minutes + ' ' + ampm;
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
      headerEl.style.background = 'linear-gradient(135deg, ' + primary + ', ' + primary + 'dd)';
      welcomeIconEl.style.background = 'linear-gradient(135deg, ' + primary + ', ' + primary + 'dd)';
      
      if (config.company.logo_url) {
        logoEl.src = config.company.logo_url;
        logoEl.style.display = 'block';
      }
      
      titleEl.textContent = config.company.name;
      welcomeTextEl.textContent = "I'm the virtual assistant for " + config.company.name + ". How can I help you today?";
      actionsEl.style.display = 'grid';
      
      // Render services
      if (config.services && config.services.length > 0) {
        let servicesHtml = '';
        config.services.forEach(s => {
          servicesHtml += '<div class="lv-widget-service" data-service="' + escapeHtml(s.name) + '">' +
            '<h4>' + escapeHtml(s.name) + '</h4>' +
            (s.description ? '<p>' + escapeHtml(s.description) + '</p>' : '') +
            '<div class="lv-widget-service-meta">' +
            '<span>⏱ ' + s.duration_minutes + ' min</span>' +
            (s.price ? '<span>💰 $' + s.price + '</span>' : '') +
            '</div></div>';
        });
        servicesHtml += '<button class="lv-widget-book-btn" id="lv-services-book" style="background:' + primary + '">📅 Schedule an Appointment</button>';
        servicesListEl.innerHTML = servicesHtml;
        
        servicesListEl.querySelectorAll('.lv-widget-service').forEach(el => {
          el.addEventListener('click', () => {
            const serviceName = el.getAttribute('data-service');
            switchToChat();
            sendMessageFromAction('Tell me about ' + serviceName);
          });
        });
        
        document.getElementById('lv-services-book')?.addEventListener('click', () => {
          switchToChat();
          sendMessageFromAction("I'd like to schedule an appointment");
        });
      } else {
        servicesListEl.innerHTML = '<p style="text-align:center;color:#6b7280;padding:20px;">No services available</p>';
      }
      
      // Render hours
      const today = new Date().getDay();
      const todayHours = config.business_hours?.find(h => h.day_of_week === today);
      let todayText = 'Closed today';
      if (todayHours && !todayHours.is_closed) {
        todayText = formatTime(todayHours.open_time) + ' - ' + formatTime(todayHours.close_time);
      }
      
      let hoursHtml = '<div class="lv-widget-today" style="background:' + primary + '">' +
        '<h4><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg> Today\\'s Hours</h4>' +
        '<p>' + todayText + '</p></div>' +
        '<div class="lv-widget-schedule"><h4>Weekly Schedule</h4>';
      
      dayNames.forEach((day, idx) => {
        const h = config.business_hours?.find(bh => bh.day_of_week === idx);
        const isToday = idx === today;
        const timeText = (!h || h.is_closed) ? 'Closed' : formatTime(h.open_time) + ' - ' + formatTime(h.close_time);
        hoursHtml += '<div class="lv-widget-day' + (isToday ? ' today' : '') + '">' +
          '<span style="font-weight:' + (isToday ? '600' : '400') + '">' + day + (isToday ? ' (Today)' : '') + '</span>' +
          '<span style="color:#6b7280">' + timeText + '</span></div>';
      });
      
      hoursHtml += '</div><button class="lv-widget-book-btn" id="lv-hours-book" style="background:' + primary + '">📅 Schedule an Appointment</button>';
      hoursListEl.innerHTML = hoursHtml;
      
      document.getElementById('lv-hours-book')?.addEventListener('click', () => {
        switchToChat();
        sendMessageFromAction("I'd like to schedule an appointment");
      });
    })
    .catch(err => {
      console.error('Widget config error:', err);
      welcomeTextEl.textContent = 'Unable to load chat';
    });
  
  function switchToChat() {
    tabs.forEach(t => t.classList.remove('active'));
    contents.forEach(c => c.classList.remove('active'));
    document.querySelector('[data-tab="chat"]').classList.add('active');
    document.getElementById('lv-content-chat').classList.add('active');
    activeTab = 'chat';
  }
  
  // Tab switching
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('lv-content-' + tabName).classList.add('active');
      activeTab = tabName;
    });
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
  
  // Quick actions
  actionsEl.querySelectorAll('.lv-widget-action').forEach(btn => {
    btn.addEventListener('click', () => {
      const msg = btn.getAttribute('data-msg');
      if (msg) sendMessageFromAction(msg);
    });
  });
  
  function sendMessageFromAction(text) {
    welcomeEl.style.display = 'none';
    actionsEl.style.display = 'none';
    messages.push({ role: 'user', content: text });
    renderMessages();
    sendToAPI();
  }
  
  // Send message
  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text || isLoading || !config) return;
    
    inputEl.value = '';
    welcomeEl.style.display = 'none';
    actionsEl.style.display = 'none';
    
    messages.push({ role: 'user', content: text });
    renderMessages();
    sendToAPI();
  }
  
  async function sendToAPI() {
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
