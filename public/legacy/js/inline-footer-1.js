(function(){
    var modal = document.getElementById('leadModal');
    if(!modal) return;
    function openModal(e){ if(e) e.preventDefault(); modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; }
    function closeModal(){ modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
    // Открытие по кнопкам «Оставить заявку» (nav-cta) и любым [data-lead-open]
    document.querySelectorAll('.nav-cta, [data-lead-open]').forEach(function(b){
        b.addEventListener('click', openModal);
    });
    // Закрытие
    modal.querySelectorAll('[data-lead-close]').forEach(function(c){ c.addEventListener('click', closeModal); });
    document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeModal(); });
    // Отправка формы попапа (тот же AJAX, что и на контактах)
    var lf = document.getElementById('leadForm');
    if(lf){
        lf.addEventListener('submit', async function(e){
            e.preventDefault();
            var consent = this.querySelector('[name="consent"]');
            if (consent && !consent.checked) {
                var m = document.getElementById('leadFormSuccess');
                if (m) { m.textContent = 'Необходимо согласие на обработку персональных данных.'; m.classList.add('show','is-error'); }
                return;
            }
            var phoneInput = this.querySelector('[name="phone"]');
            if (phoneInput && phoneInput.value.replace(/\D/g,'').length < 10) {
                var mp = document.getElementById('leadFormSuccess');
                if (mp) { mp.textContent = 'Пожалуйста, укажите корректный номер телефона.'; mp.classList.add('show','is-error'); }
                phoneInput.focus();
                return;
            }
            var btn = this.querySelector('[type="submit"]');
            var msg = document.getElementById('leadFormSuccess');
            var orig = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
            btn.disabled = true;
            var fd = new FormData(this);
            fd.append('action','adelf_contact');
            fd.append('nonce', this.querySelector('[name="adelf_nonce_lead"]').value);
            try {
                var r = await fetch(adelfAjax.ajaxUrl, { method:'POST', body:fd });
                var d = await r.json();
                msg.innerHTML = (d.data && d.data.message) || (d.success ? 'Заявка отправлена!' : 'Ошибка отправки');
                msg.className = 'success-msg show' + (d.success ? '' : ' is-error'); if(d.success&&window.geobitGoal){window.geobitGoal('lead_form');}
                btn.innerHTML = '<i class="fas fa-check"></i> Отправлено!';
                if(d.success){ setTimeout(function(){ lf.reset(); btn.innerHTML=orig; btn.disabled=false; msg.className='success-msg'; closeModal(); }, 4000); }
                else { btn.innerHTML=orig; btn.disabled=false; }
            } catch(err){
                msg.innerHTML = 'Произошла ошибка. Попробуйте позже.';
                msg.className = 'success-msg show is-error';
                btn.innerHTML=orig; btn.disabled=false;
            }
        });
    }
})();
