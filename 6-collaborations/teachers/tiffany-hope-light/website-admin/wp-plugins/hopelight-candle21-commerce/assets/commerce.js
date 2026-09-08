(() => {
  document.querySelectorAll('.hlc21-picker').forEach(picker => {
    const fields = [...picker.querySelectorAll('input[type="number"]')];
    const form = picker.closest('form');
    const button = form?.querySelector('.single_add_to_cart_button');
    const status = picker.querySelector('[role="status"]');
    const update = () => {
      const valid = fields.every(input => /^(0|[1-9][0-9]*)$/.test(input.value) && Number(input.value) <= 21);
      const total = fields.reduce((sum, input) => sum + (Number(input.value) || 0), 0);
      const ok = valid && total === 21;
      status.textContent = !valid ? '請填 0 到 21 的整數。' : total < 21 ? `已選 ${total} 顆，還差 ${21 - total} 顆。` : total > 21 ? `已選 ${total} 顆，超過 ${total - 21} 顆。` : '已選滿 21 顆，可以加入購物車。';
      if (button) { button.disabled = !ok; button.setAttribute('aria-disabled', String(!ok)); }
      return ok;
    };
    picker.addEventListener('input', update);
    form?.addEventListener('submit', event => { if (!update()) { event.preventDefault(); fields.find(input => !input.validity.valid)?.focus(); } });
    update();
  });
})();
