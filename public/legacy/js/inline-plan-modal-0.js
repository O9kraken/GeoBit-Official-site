(function(){
    var modal = document.getElementById('planModal');
    if (!modal) return;
    var chip      = document.getElementById('planModalChip'),
        chipLabel = document.getElementById('planModalChipLabel'),
        chipName  = document.getElementById('planModalChipName'),
        chipPrice = document.getElementById('planModalChipPrice'),
        fName     = document.getElementById('planFieldName'),
        fPrice    = document.getElementById('planFieldPrice'),
        fService  = document.getElementById('planFieldService'),
        defaultService = fService.value,
        sub   = document.getElementById('planModalSub'),
        title = document.getElementById('planModalTitle'),
        form  = document.getElementById('planForm'),
        msg   = document.getElementById('planFormMsg'),
        lastFocus = null;

    function openModal(plan, price, service){
        lastFocus = document.activeElement;
        fService.value = service || defaultService;
        if (plan){
            // Выбран конкретный тариф
            fName.value = plan;
            fPrice.value = price || '';
            chipLabel.textContent = 'Тариф';
            chipName.textContent = plan;
            chipPrice.textContent = price || '';
            chip.hidden = false;
            title.textContent = 'Оформить тариф';
            sub.textContent = 'Вы выбрали тариф «'+plan+'». Заполните форму — и мы свяжемся с вами.';
        } else if (service){
            // Выбрана услуга без тарифа
            fName.value = ''; fPrice.value = '';
            chipLabel.textContent = 'Услуга';
            chipName.textContent = service;
            chipPrice.textContent = '';
            chip.hidden = false;
            title.textContent = 'Заказать услугу';
            sub.textContent = 'Вы выбрали услугу «'+service+'». Заполните форму — и мы свяжемся с вами.';
        } else {
            fName.value=''; fPrice.value=''; chip.hidden = true;
            title.textContent = 'Оставить заявку';
            sub.textContent = 'Заполните форму — свяжемся в течение часа и обсудим детали';
        }
        modal.classList.add('open');
        modal.setAttribute('aria-hidden','false');
        document.body.style.overflow='hidden';
        var fn = document.getElementById('pm_name'); if (fn) setTimeout(function(){ fn.focus(); }, 60);
    }
    function closeModal(){
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden','true');
        document.body.style.overflow='';
        if (lastFocus) lastFocus.focus();
    }

    // Триггеры
    document.querySelectorAll('[data-plan-open]').forEach(function(btn){
        btn.addEventListener('click', function(e){
            e.preventDefault();
            openModal(
                btn.getAttribute('data-plan'),
                btn.getAttribute('data-price'),
                btn.getAttribute('data-service')
            );
        });
    });
    // Закрытие
    modal.querySelectorAll('[data-plan-close]').forEach(function(el){
        el.addEventListener('click', closeModal);
    });
    document.addEventListener('keydown', function(e){ if (e.key==='Escape' && modal.classList.contains('open')) closeModal(); });

    // Отправка через существующий AJAX adelf_contact
    if (form){
        form.addEventListener('submit', async function(e){
            e.preventDefault();
            var consent = form.querySelector('[name="consent"]');
            if (consent && !consent.checked){
                msg.textContent='Необходимо согласие на обработку персональных данных.';
                msg.className='success-msg show is-error'; return;
            }
            var phoneInput = form.querySelector('[name="phone"]');
            if (phoneInput && phoneInput.value.replace(/\D/g,'').length < 10){
                msg.textContent='Пожалуйста, укажите корректный номер телефона.';
                msg.className='success-msg show is-error';
                phoneInput.focus();
                return;
            }
            var btn = form.querySelector('[type="submit"]'), orig = btn.innerHTML;
            btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Отправка...'; btn.disabled=true;

            var fd = new FormData(form);
            // Склеиваем услугу и тариф в поле service, тариф дублируем в message
            var plan = fd.get('plan_name')||'', price = fd.get('plan_price')||'', svc = fd.get('service_title')||'';
            fd.set('service', svc + (plan ? (' — тариф «'+plan+'»'+(price?(' ('+price+')'):'')) : ''));
            var extra = plan ? ('Выбранный тариф: '+plan+(price?(' — '+price):'')+'\n\n') : '';
            fd.set('message', extra + (fd.get('message')||''));
            fd.append('action','adelf_contact');
            fd.append('nonce', (form.querySelector('[name="adelf_nonce_plan"]')||{}).value);

            try{
                var r = await fetch(adelfAjax.ajaxUrl, { method:'POST', body:fd });
                var d = await r.json();
                msg.innerHTML = d.data?.message || (d.success ? 'Заявка отправлена!' : 'Ошибка отправки');
                msg.className='success-msg show' + (d.success ? '' : ' is-error'); if(d.success&&window.geobitGoal){window.geobitGoal('lead_form');}
                if (d.success){
                    btn.innerHTML='<i class="fas fa-check"></i> Отправлено!';
                    setTimeout(function(){ form.reset(); btn.innerHTML=orig; btn.disabled=false; msg.className='success-msg'; closeModal(); }, 3500);
                } else { btn.innerHTML=orig; btn.disabled=false; }
            }catch(err){
                msg.innerHTML='Произошла ошибка. Попробуйте позже.'; msg.className='success-msg show is-error';
                btn.innerHTML=orig; btn.disabled=false;
            }
        });
    }
})();
