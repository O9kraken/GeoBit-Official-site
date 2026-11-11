(function () {
        // Светлая тема отключена: сайт всегда тёмный.
        document.documentElement.setAttribute('data-theme', 'dark');
        try { localStorage.removeItem('adelf-theme'); } catch (e) {}
    })();
