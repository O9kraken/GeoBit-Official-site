// AJAX Contact Form for WordPress
document.getElementById('contactForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const consent = this.querySelector('[name="consent"]');
    const msg = document.getElementById('formSuccess');
    if (consent && !consent.checked) {
        if (msg) { msg.textContent = 'Необходимо согласие на обработку персональных данных.'; msg.classList.add('show','is-error'); }
        return;
    }
    const phoneInput = this.querySelector('[name="phone"]');
    if (phoneInput && phoneInput.value.replace(/\D/g,'').length < 10) {
        if (msg) { msg.textContent = 'Пожалуйста, укажите корректный номер телефона.'; msg.classList.add('show','is-error'); }
        phoneInput.focus();
        return;
    }
    const btn = this.querySelector('[type="submit"]');
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
    btn.disabled = true;

    const fd = new FormData(this);
    fd.append('action', 'adelf_contact');
    fd.append('nonce', document.querySelector('[name="adelf_nonce"]').value);

    try {
        const r = await fetch(adelfAjax.ajaxUrl, { method: 'POST', body: fd });
        const d = await r.json();
        msg.innerHTML = d.data?.message || (d.success ? 'Заявка отправлена!' : 'Ошибка отправки');
        msg.className = 'success-msg show' + (d.success ? '' : ' is-error'); if(d.success&&window.geobitGoal){window.geobitGoal('lead_form');}
        btn.innerHTML = '<i class="fas fa-check"></i> Отправлено!';
        if (d.success) { setTimeout(() => { this.reset(); btn.innerHTML = orig; btn.disabled = false; msg.className = 'success-msg'; }, 5000); }
        else { btn.innerHTML = orig; btn.disabled = false; }
    } catch(err) {
        msg.innerHTML = 'Произошла ошибка. Попробуйте позже.';
        msg.className = 'success-msg show is-error';
        btn.innerHTML = orig; btn.disabled = false;
    }
});
