(() => {
  const form = document.querySelector('.hlc21-settings');
  if (!form) return;
  form.querySelectorAll('input').forEach(input => {
    const validate = () => {
      input.setCustomValidity('');
      if (input.required && !input.value.trim()) input.setCustomValidity('這個欄位不可空白。');
      else if (input.type === 'number' && (!/^(0|[1-9][0-9]*)$/.test(input.value) || !input.validity.valid)) input.setCustomValidity('請填範圍內的整數，不可填負數或小數。');
      else if (input.type === 'text' && /<[^>]*>/.test(input.value)) input.setCustomValidity('請填純文字，不可使用 HTML。');
      if (input.validity.valid) form.querySelector('[role="alert"]').textContent = '';
    };
    input.addEventListener('input', validate);
    input.addEventListener('invalid', () => {
      if (input.closest('details')) input.closest('details').open = true;
      form.querySelector('[role="alert"]').textContent = '請先修正標示的欄位，設定尚未儲存。';
    });
  });
})();
