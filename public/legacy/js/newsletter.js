/* Подписка на рассылку (из template-parts/newsletter.php, для всех форм .gb-newsletter-form) */
(function(){
  document.querySelectorAll('.gb-newsletter-form').forEach(function(form){
    if (form.__nlBound) return; form.__nlBound = true;
    form.addEventListener('submit', async function(e){
      e.preventDefault();
      var msg = form.querySelector('.gb-newsletter-msg');
      var show = function(t, err){ msg.innerHTML = t; msg.className = 'success-msg gb-newsletter-msg show' + (err ? ' is-error' : ''); };
      var consent = form.querySelector('[name="consent"]');
      if (consent && !consent.checked) return show('Необходимо согласие на обработку персональных данных.', true);
      var consentM = form.querySelector('[name="consent_mailing"]');
      if (consentM && !consentM.checked) return show('Необходимо согласие на получение рассылки.', true);
      var btn = form.querySelector('[type="submit"]'); var orig = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; btn.disabled = true;
      var fd = new FormData(form);
      fd.append('action','adelf_subscribe');
      fd.append('nonce', window.adelfSubNonce || '');
      fd.append('page', location.pathname);
      try {
        var r = await fetch(adelfAjax.ajaxUrl, { method:'POST', body:fd });
        var d = await r.json();
        show((d.data && d.data.message) || (d.success ? 'Вы подписались!' : 'Ошибка. Попробуйте позже.'), !d.success);
        if (d.success) form.reset();
      } catch(err){ show('Произошла ошибка. Попробуйте позже.', true); }
      btn.innerHTML = orig; btn.disabled = false;
    });
  });
})();
