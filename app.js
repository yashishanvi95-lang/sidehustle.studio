const modes = {
  product: {
    title: 'Write a product listing',
    description: 'Give your product the words it deserves. Add a few details and let the model draft the rest.',
    label: 'Tell us about the product',
    placeholder: 'Soy wax candles with cozy vanilla and sandalwood notes, handmade in small batches...',
    hint: 'Mention features, audience, price, or what makes it special.',
    system: 'You are a practical copywriter for small independent businesses. Write a clear, appealing product listing using only facts supplied by the user. Do not invent certifications, guarantees, reviews, or product claims. Include a short headline and a concise description. If appropriate, finish with a gentle call to action.'
  },
  social: {
    title: 'Create a social caption',
    description: 'Turn your idea into a scroll-stopping caption that still sounds like you.',
    label: 'What is the post about?',
    placeholder: 'Launching my first handmade jewellery collection this weekend. Gold-tone, minimal, gift-ready...',
    hint: 'Add the platform, audience, offer, or key message if you know it.',
    system: 'You are a thoughtful social media writer for small businesses. Create one strong opening hook, a natural caption, and a clear call to action. Add a few relevant hashtags only if they fit. Avoid fake urgency, exaggerated claims, and generic hype.'
  },
  client: {
    title: 'Draft a client message',
    description: 'Write a warm, professional message for the little business moments that take too much time.',
    label: 'What do you need to tell the client?',
    placeholder: 'I need to ask a client for missing feedback on a logo project. The deadline is Friday and I want to be polite...',
    hint: 'Share the situation, the outcome you want, and any important deadline.',
    system: 'You are a professional communication assistant for freelancers. Draft a concise, respectful client message with a clear next step. Do not sound pushy or invent agreements, dates, or facts not supplied by the user.'
  }
};
let currentMode = 'product';
const form = document.querySelector('#generator-form');
const details = document.querySelector('#details');
const business = document.querySelector('#business');
const tone = document.querySelector('#tone');
const length = document.querySelector('#length');
const generateBtn = document.querySelector('#generate-btn');
const resultContent = document.querySelector('#result-content');
const copyBtn = document.querySelector('#copy-btn');
const statusText = document.querySelector('#model-status-text');
const statusDot = document.querySelector('.status-dot');
const charCount = document.querySelector('#char-count');
const toast = document.querySelector('#toast');
let lastDraft = '';
let toastTimeout;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 2600);
}
function setStatus(message, kind = '') {
  statusText.textContent = message;
  statusDot.className = 'status-dot' + (kind ? ` ${kind}` : '');
}
function setMode(mode) {
  currentMode = mode;
  const config = modes[mode];
  document.querySelectorAll('.tool').forEach(button => button.classList.toggle('active', button.dataset.mode === mode));
  document.querySelector('#form-title').textContent = config.title;
  document.querySelector('#form-description').textContent = config.description;
  document.querySelector('#details-label').innerHTML = `${config.label} <span class="required">REQUIRED</span>`;
  details.placeholder = config.placeholder;
  document.querySelector('#hint').textContent = config.hint;
  clearResult();
}
function clearResult() {
  lastDraft = '';
  copyBtn.disabled = true;
  resultContent.className = 'result-content empty-state';
  resultContent.innerHTML = '<div class="empty-illustration"><div class="paper paper-back"></div><div class="paper paper-front"><span>✦</span><i></i><i></i><i class="short-line"></i></div><div class="tiny-star star-a">✧</div><div class="tiny-star star-b">✦</div></div><h3>Your next great draft starts here.</h3><p>Choose a tool, add your details, and your local AI model will help you get past the blank page.</p><div class="empty-tags"><span>Product copy</span><span>Captions</span><span>Client notes</span></div>';
}
function showDraft(text) {
  lastDraft = text.trim();
  resultContent.className = 'result-content result-output';
  resultContent.textContent = lastDraft;
  copyBtn.disabled = !lastDraft;
}

document.querySelectorAll('.tool').forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)));
details.addEventListener('input', () => { charCount.textContent = `${details.value.length} / 1800`; });
document.querySelector('#clear-btn').addEventListener('click', () => {
  details.value = '';
  business.value = '';
  charCount.textContent = '0 / 1800';
  clearResult();
  details.focus();
});
copyBtn.addEventListener('click', async () => {
  if (!lastDraft) return;
  try {
    await navigator.clipboard.writeText(lastDraft);
    showToast('Draft copied to clipboard.');
  } catch {
    const range = document.createRange();
    range.selectNodeContents(resultContent);
    const selection = window.getSelection();
    selection.removeAllRanges(); selection.addRange(range);
    showToast('Select and copy the highlighted draft.');
  }
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  const userDetails = details.value.trim();
  if (!userDetails) { details.focus(); showToast('Add a few details first.'); return; }
  const config = modes[currentMode];
  const context = business.value.trim() ? `Business or brand: ${business.value.trim()}\n` : '';
  const prompt = `${context}Details: ${userDetails}\nTone: ${tone.value}\nLength: ${length.value}\n\nCreate the ${currentMode === 'product' ? 'product listing' : currentMode === 'social' ? 'social media caption' : 'client message'} now.`;
  generateBtn.disabled = true;
  generateBtn.innerHTML = '<span>◌</span> Working locally…';
  copyBtn.disabled = true;
  resultContent.className = 'result-content result-output';
  resultContent.textContent = 'Your local model is thinking…\n\nThe first run may take a little longer while the model loads.';
  setStatus('Connecting to local Ollama…');
  try {
    const response = await fetch('/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system: config.system, prompt })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Could not generate a draft.');
    if (!data.text) throw new Error('The model returned an empty response. Try again.');
    showDraft(data.text);
    setStatus(`Generated with ${data.model || 'your local model'}`, 'ready');
  } catch (error) {
    resultContent.className = 'result-content result-output';
    resultContent.textContent = `Could not reach your local AI model.\n\n${error.message}\n\nQuick setup:\n1. Install Ollama from https://ollama.com\n2. In a terminal, run: ollama run llama3.2\n3. Keep Ollama running, then refresh this page.\n4. Start this project with: npm start\n\nYour form details have not been sent to a hosted AI provider.`;
    setStatus('Local model unavailable', 'error');
    copyBtn.disabled = true;
  } finally {
    generateBtn.disabled = false;
    generateBtn.innerHTML = '<span>✦</span> Generate draft <span class="button-arrow">↗</span>';
  }
});

async function checkHealth() {
  try {
    const response = await fetch('/api/health');
    const data = await response.json();
    if (data.ok) setStatus(`Ollama ready · ${data.model}`, 'ready');
    else setStatus('Start Ollama to generate', 'error');
  } catch { setStatus('Waiting for local model'); }
}
checkHealth();
