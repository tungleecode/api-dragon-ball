/* ═════════════════════════════════════════════════════
   Super Saiyan API Hub — script.js
   Focus: Gemini AI Proxy & Zeni Pay (Localhost Backend)
═════════════════════════════════════════════════════ */

let BASE_URL = window.location.origin; 
// Tránh hiển thị lỗi file:// khi bạn mở trực tiếp file index.html trên máy tính
if (BASE_URL === 'file://' || BASE_URL === 'null') {
    BASE_URL = 'https://super-saiyan-api.vercel.app'; 
}

// ══════════════════════════════════════════
//  API DATA — 2 Core APIs
// ══════════════════════════════════════════
const API_DATA = [
  {
    id: 'gemini',
    emoji: '🌹',
    name: 'Rosé AI Brain',
    description: 'Kết nối với bộ não thần thánh của Rosé AI. Đóng vai trò Proxy giúp bảo mật tuyệt đối hệ thống.',
    endpoints: [
      {
        id: 'gemini-chat',
        name: 'Gửi tin nhắn (Chat)',
        method: 'POST',
        url: '/api/chat', // Tương lai bạn sẽ tạo route này ở backend
        description: 'Gửi một câu hỏi (prompt) lên server và nhận phản hồi trí tuệ từ Rosé.',
        params: [
          { key: 'prompt', label: 'Câu hỏi (Prompt)', placeholder: 'Ví dụ: Hãy kể chuyện Goku', required: true, type: 'body' },
        ],
        baseUrl: `${BASE_URL}/api/chat`,
        buildUrl: () => `${BASE_URL}/api/chat`,
        buildBody: (params) => JSON.stringify({ prompt: params.prompt }),
        curlExample: `curl -X POST ${BASE_URL}/api/chat \\
-H "Content-Type: application/json" \\
-d '{"prompt": "Xin chào"}'`,
        jsExample: `const res = await fetch('${BASE_URL}/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: "Xin chào" })
});
const result = await res.json();
// Lấy câu trả lời:
console.log(result.reply);`,
      }
    ],
  },

  {
    id: 'zenipay',
    emoji: '💎',
    name: 'Rosé Pay',
    description: 'Hệ thống giả lập thanh toán quyền năng. Khởi tạo giao dịch để lấy mã QR và kiểm tra trạng thái.',
    endpoints: [
      {
        id: 'zeni-create',
        name: 'Khởi tạo thanh toán',
        method: 'POST',
        url: '/api/create-payment',
        description: 'Tạo một giao dịch mới với số tiền cụ thể. Trả về mã giao dịch và mã QR base64.',
        params: [
          { key: 'amount', label: 'Số tiền (VND)', placeholder: '500000', required: true, type: 'body' },
        ],
        baseUrl: `${BASE_URL}/api/create-payment`,
        buildUrl: () => `${BASE_URL}/api/create-payment`,
        buildBody: (params) => JSON.stringify({ amount: parseInt(params.amount) || 500000 }),
        buildHeaders: () => ({ 'Content-Type': 'application/json' }),
        curlExample: `curl -X POST ${BASE_URL}/api/create-payment \\
-H "Content-Type: application/json" \\
-d '{"amount": 500000}'`,
        jsExample: `const res = await fetch('${BASE_URL}/api/create-payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount: 500000 })
});
const result = await res.json();
console.log(result.data.transaction_id, result.data.qr_code);`,
      },
      {
        id: 'zeni-status',
        name: 'Kiểm tra trạng thái',
        method: 'GET',
        url: '/api/status/{txnId}',
        description: 'Kiểm tra xem giao dịch đã được thanh toán (PAID) hay chưa (PENDING).',
        params: [
          { key: 'txnId', label: 'Mã giao dịch', placeholder: 'ZENI-123456', required: true, type: 'path' },
        ],
        baseUrl: `${BASE_URL}/api/status/{txnId}`,
        buildUrl: (params) => `${BASE_URL}/api/status/${params.txnId || 'ZENI-000000'}`,
        buildBody: () => null,
        buildHeaders: () => ({ 'Accept': 'application/json' }),
        curlExample: `curl ${BASE_URL}/api/status/ZENI-123456`,
        jsExample: `const res = await fetch('${BASE_URL}/api/status/ZENI-123456');
const result = await res.json();
console.log(result.data.status); // PENDING or PAID`,
      }
    ],
  },
];

// ══════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════
function jsonSyntaxHighlight(json) {
  if (typeof json !== 'string') {
    json = JSON.stringify(json, null, 2);
  }
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = 'json-number';
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? 'json-key' : 'json-string';
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean';
      } else if (/null/.test(match)) {
        cls = 'json-null';
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check" style="color:#2ecc71;"></i>';
    setTimeout(() => { btn.innerHTML = orig; }, 2000);
  });
}

// ══════════════════════════════════════════
//  RENDER SIDEBAR & API LIST
// ══════════════════════════════════════════
function renderUI() {
  const sidebarContainer = document.getElementById('sidebarCategories');
  const apiContainer = document.getElementById('api-list');
  let sidebarHtml = '';
  let apiHtml = '';

  API_DATA.forEach(cat => {
    sidebarHtml += `
      <a href="#cat-${cat.id}" class="sidebar-link" data-section="cat-${cat.id}">
        <span class="emoji">${cat.emoji}</span>
        <span>${cat.name} (${cat.endpoints.length})</span>
      </a>
    `;

    apiHtml += `
      <section id="cat-${cat.id}" class="api-category content-section">
        <div class="category-header">
          <span class="category-emoji">${cat.emoji}</span>
          <h2 class="category-name">${cat.name}</h2>
        </div>
        <p style="font-size:1.05rem;color:#ddd;margin-bottom:1.5rem;line-height:1.6;font-weight:500;">${cat.description}</p>
        <div class="endpoints-list">
          ${cat.endpoints.map(ep => renderEndpointCard(ep)).join('')}
        </div>
      </section>
    `;
  });

  sidebarContainer.innerHTML = sidebarHtml;
  apiContainer.innerHTML = apiHtml;

  // Event Listeners for UI
  document.querySelectorAll('.sidebar-link[data-section]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById(link.dataset.section);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (window.innerWidth <= 1024) closeSidebar();
      }
    });
  });

  document.querySelectorAll('.endpoint-card-header').forEach(header => {
    header.addEventListener('click', (e) => {
      if (e.target.closest('.try-btn')) return;
      header.closest('.endpoint-card').classList.toggle('expanded');
    });
  });

  document.querySelectorAll('.try-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openModal(btn.dataset.ep);
    });
  });
}

function renderEndpointCard(ep) {
  const paramsTable = ep.params.length > 0 ? `
    <div style="margin-bottom:1.5rem;">
      <div class="params-title">Tham số (${ep.method === 'GET' ? 'Path/Query' : 'Body'})</div>
      <table class="params-table">
        <thead><tr><th>Tên</th><th>Bắt buộc</th><th>Loại</th><th>Mô tả</th></tr></thead>
        <tbody>
          ${ep.params.map(p => `
            <tr>
              <td>${p.key}</td>
              <td>${p.required ? '<span style="color:#e74c3c;font-weight:bold;">Yes</span>' : '<span style="color:#f39c12;">No</span>'}</td>
              <td style="color:#aaa;font-size:0.85rem;">${p.type}</td>
              <td>${p.label}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : '';

  return `
    <div class="endpoint-card" id="ep-${ep.id}">
      <div class="endpoint-card-header">
        <span class="method-badge ${ep.method}">${ep.method}</span>
        <span class="endpoint-url">${ep.url}</span>
        <div class="endpoint-actions">
          <button class="try-btn" data-ep="${ep.id}"><i class="fas fa-bolt"></i> Thử ngay</button>
        </div>
      </div>
      <div class="endpoint-card-body">
        <p class="endpoint-desc">${ep.description}</p>
        ${paramsTable}
        <div style="display:flex;gap:15px;flex-wrap:wrap;">
          <div style="flex:1;min-width:300px;">
            <div class="params-title">cURL Example</div>
            <div class="code-block"><pre><code>${ep.curlExample}</code></pre></div>
          </div>
          <div style="flex:1;min-width:300px;">
            <div class="params-title">JS Fetch Example</div>
            <div class="code-block"><pre><code>${ep.jsExample}</code></pre></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ══════════════════════════════════════════
//  MODAL LOGIC
// ══════════════════════════════════════════
let currentEndpoint = null;

function openModal(epId) {
  let ep = null;
  for (const cat of API_DATA) {
    ep = cat.endpoints.find(e => e.id === epId);
    if (ep) break;
  }
  if (!ep) return;
  currentEndpoint = ep;

  document.getElementById('modalMethod').className = `method-badge ${ep.method}`;
  document.getElementById('modalMethod').textContent = ep.method;
  document.getElementById('modalEndpointName').textContent = ep.name;
  document.getElementById('modalDesc').textContent = ep.description;
  
  const paramsContainer = document.getElementById('modalParams');
  if (ep.params.length > 0) {
    paramsContainer.innerHTML = ep.params.map(p => `
      <div class="param-input-row">
        <label>${p.label} ${p.required ? '<span style="color:#e74c3c;">*</span>' : ''}</label>
        ${p.key === 'prompt' 
          ? `<textarea id="param-${p.key}" data-key="${p.key}" rows="3" placeholder="${p.placeholder}" ${p.required ? 'required' : ''}></textarea>`
          : `<input type="text" id="param-${p.key}" data-key="${p.key}" placeholder="${p.placeholder}" ${p.required ? 'required' : ''} />`
        }
      </div>
    `).join('');
  } else {
    paramsContainer.innerHTML = '';
  }

  updateModalUrl();
  paramsContainer.querySelectorAll('input, textarea').forEach(input => {
    input.addEventListener('input', updateModalUrl);
  });

  document.getElementById('modalResponse').classList.add('hidden');
  document.getElementById('modalLoading').classList.add('hidden');
  document.getElementById('tryModal').classList.remove('hidden');
}

function updateModalUrl() {
  if (!currentEndpoint) return;
  const params = {};
  document.querySelectorAll('#modalParams input, #modalParams textarea').forEach(input => {
    params[input.dataset.key] = input.value;
  });
  document.getElementById('modalUrl').textContent = currentEndpoint.buildUrl(params);
}

function closeModal() {
  document.getElementById('tryModal').classList.add('hidden');
  currentEndpoint = null;
}

async function sendRequest() {
  if (!currentEndpoint) return;
  const params = {};
  let valid = true;

  document.querySelectorAll('#modalParams input, #modalParams textarea').forEach(input => {
    params[input.dataset.key] = input.value.trim();
    if (input.required && !input.value.trim()) {
      input.style.borderColor = '#e74c3c';
      valid = false;
    } else {
      input.style.borderColor = '';
    }
  });

  if (!valid) return;

  const url = currentEndpoint.buildUrl(params);
  const body = currentEndpoint.buildBody ? currentEndpoint.buildBody(params) : null;
  const headers = currentEndpoint.buildHeaders ? currentEndpoint.buildHeaders(params) : { 'Content-Type': 'application/json' };

  document.getElementById('modalLoading').classList.remove('hidden');
  document.getElementById('modalResponse').classList.add('hidden');
  document.getElementById('modalSendBtn').disabled = true;

  const startTime = Date.now();

  try {
    const options = {
      method: currentEndpoint.method,
      headers: headers,
    };
    if (body && (currentEndpoint.method === 'POST' || currentEndpoint.method === 'PUT')) {
      options.body = body;
    }

    const res = await fetch(url, options);
    const elapsed = Date.now() - startTime;
    
    // Attempt to parse JSON
    let data;
    try {
      data = await res.json();
    } catch {
      data = { raw: "Không thể parse JSON hoặc Server trả về rỗng." };
    }

    const statusBadge = document.getElementById('modalStatusBadge');
    statusBadge.textContent = `${res.status} ${res.statusText}`;
    statusBadge.className = `status-badge-modal ${res.ok ? 'ok' : 'err'}`;
    document.getElementById('modalTimeBadge').textContent = `${elapsed}ms`;
    
    // Nếu có mã QR, GHI ĐÈ toàn bộ để chỉ hiển thị ảnh mã QR thật to và rõ
    if (data && data.data && data.data.qr_code) {
      document.getElementById('modalResponseCode').innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; padding: 20px 0;">
          <img src="${data.data.qr_code}" alt="QR Code" style="width: 280px; height: 280px; object-fit: contain; border-radius: 16px; border: 4px solid #ff007f; box-shadow: 0 0 30px rgba(255,0,127,0.8);" />
        </div>
      `;
    } else {
      document.getElementById('modalResponseCode').innerHTML = jsonSyntaxHighlight(data);
    }
    
    document.getElementById('modalResponse').classList.remove('hidden');
  } catch (err) {
    const elapsed = Date.now() - startTime;
    document.getElementById('modalStatusBadge').textContent = 'ERROR';
    document.getElementById('modalStatusBadge').className = 'status-badge-modal err';
    document.getElementById('modalTimeBadge').textContent = `${elapsed}ms`;
    
    let msg = err.message;
    if (msg.includes('fetch')) {
      msg = 'Không thể kết nối đến Backend. Hãy chắc chắn bạn đã chạy "node server.js" ở cổng 3000!';
    }
    document.getElementById('modalResponseCode').innerHTML = `<span style="color:#e74c3c;font-weight:bold;">${msg}</span>`;
    document.getElementById('modalResponse').classList.remove('hidden');
  } finally {
    document.getElementById('modalLoading').classList.add('hidden');
    document.getElementById('modalSendBtn').disabled = false;
  }
}

// ══════════════════════════════════════════
//  SIDEBAR & UTILS
// ══════════════════════════════════════════
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebarOverlay').classList.add('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
}

// ══════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  renderUI();

  // Loader dismiss
  setTimeout(() => {
    const loader = document.getElementById('loader');
    loader.classList.add('fade-out');
    setTimeout(() => loader.remove(), 500);
  }, 1800);

  // Modal events
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalSendBtn').addEventListener('click', sendRequest);
  document.getElementById('modalCopyUrl').addEventListener('click', () => {
    copyToClipboard(document.getElementById('modalUrl').textContent, document.getElementById('modalCopyUrl'));
  });
  document.getElementById('copyResponseBtn').addEventListener('click', () => {
    copyToClipboard(document.getElementById('modalResponseCode').textContent, document.getElementById('copyResponseBtn'));
  });

  // Sidebar events
  document.getElementById('menuToggle').addEventListener('click', openSidebar);
  document.getElementById('sidebarClose').addEventListener('click', closeSidebar);
  document.getElementById('sidebarOverlay').addEventListener('click', closeSidebar);

  // Scroll spy
  window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    let current = '';
    sections.forEach(sec => {
      if (sec.getBoundingClientRect().top <= 100) current = sec.id;
    });
    document.querySelectorAll('.sidebar-link').forEach(link => {
      link.classList.remove('active');
      if (link.dataset.section === current) link.classList.add('active');
    });
  });

  // ══════════════════════════════════════════
  //  AUDIO LOGIC
  // ══════════════════════════════════════════
  const bgMusic = document.getElementById('bgMusic');
  const musicToggleBtn = document.getElementById('musicToggleBtn');
  let isMusicPlaying = false;
  let hasUserInteracted = false;

  bgMusic.volume = 0.5; // Giảm âm lượng 50%

  // Phát nhạc khi người dùng tương tác lần đầu
  document.body.addEventListener('click', () => {
    if (!hasUserInteracted) {
      hasUserInteracted = true;
      bgMusic.play().then(() => {
        isMusicPlaying = true;
        musicToggleBtn.classList.remove('muted');
        musicToggleBtn.querySelector('i').className = 'fas fa-volume-up';
      }).catch(err => console.log('Audio blocked by browser:', err));
    }
  }, { once: true });

  // Xử lý nút tắt/bật nhạc
  musicToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    hasUserInteracted = true;
    if (bgMusic.paused) {
      bgMusic.play();
      musicToggleBtn.classList.remove('muted');
      musicToggleBtn.querySelector('i').className = 'fas fa-volume-up';
    } else {
      bgMusic.pause();
      musicToggleBtn.classList.add('muted');
      musicToggleBtn.querySelector('i').className = 'fas fa-volume-mute';
    }
  });

});
