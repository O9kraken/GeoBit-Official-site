(function(){
    var modal = document.getElementById('ctaLeadModal');
    var openBtn = document.getElementById('ctaLeadOpen');
    if(!modal || !openBtn) return;

    function openModal(e){
        if(e) e.preventDefault();
        modal.classList.add('open');
        modal.setAttribute('aria-hidden','false');
        document.body.style.overflow='hidden';
        var first = modal.querySelector('input[name="name"]');
        if(first) setTimeout(function(){ first.focus(); }, 80);
    }
    function closeModal(){
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden','true');
        document.body.style.overflow='';
    }

    openBtn.addEventListener('click', openModal);
    modal.querySelectorAll('[data-cta-close]').forEach(function(c){ c.addEventListener('click', closeModal); });
    document.addEventListener('keydown', function(e){
        if(e.key==='Escape' && modal.classList.contains('open')) closeModal();
    });

    var form = document.getElementById('ctaLeadForm');
    if(form){
        form.addEventListener('submit', async function(e){
            e.preventDefault();
            var msg = document.getElementById('ctaLeadSuccess');
            var consent = this.querySelector('[name="consent"]');
            if (consent && !consent.checked) {
                if (msg) { msg.textContent = 'Необходимо согласие на обработку персональных данных.'; msg.classList.add('show','is-error'); }
                return;
            }
            var phoneInput = this.querySelector('[name="phone"]');
            if (phoneInput && phoneInput.value.replace(/\D/g,'').length < 10) {
                if (msg) { msg.textContent = 'Пожалуйста, укажите корректный номер телефона.'; msg.classList.add('show','is-error'); }
                phoneInput.focus();
                return;
            }
            var btn  = this.querySelector('[type="submit"]');
            var orig = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
            btn.disabled = true;

            var fd = new FormData(this);
            fd.append('action','adelf_contact');
            fd.append('nonce', this.querySelector('[name="adelf_nonce_cta"]').value);

            try {
                var r = await fetch(adelfAjax.ajaxUrl, { method:'POST', body:fd });
                var d = await r.json();
                msg.innerHTML = (d.data && d.data.message) || (d.success ? 'Заявка отправлена!' : 'Ошибка отправки');
                msg.className = 'success-msg show' + (d.success ? '' : ' is-error');
                if(d.success){
                    btn.innerHTML = '<i class="fas fa-check"></i> Отправлено!';
                    setTimeout(function(){
                        form.reset();
                        btn.innerHTML = orig;
                        btn.disabled  = false;
                        msg.className = 'success-msg';
                        closeModal();
                    }, 4000);
                } else {
                    btn.innerHTML = orig;
                    btn.disabled  = false;
                }
            } catch(err){
                msg.innerHTML = 'Произошла ошибка. Попробуйте позже.';
                msg.className = 'success-msg show is-error';
                btn.innerHTML = orig;
                btn.disabled  = false;
            }
        });
    }
})();
