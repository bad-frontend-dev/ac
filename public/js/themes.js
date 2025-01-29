$(function () {
    var $themeButton = $("#themeButton"),
        $pluginButton = $("#pluginButton"),
        $themeWindow = $("#themeWindow"),
        $pluginWindow = $("#pluginWindow"),
        $themeList = $("#themeList"),
        $pluginList = $("#pluginList"),
        customEditorWindow,
        currentEditorType = null;

    function loadThemes() {
        $.getJSON("./themes.json", function (data) {
            data.themes.forEach(function (theme) {
                var $themeItem = $("<li>");
                var $themeTitle = $("<div>").html(
                    theme.name +
                        ' by <span class="theme-author">' +
                        theme.author +
                        "</span>"
                );
                var $themeDescription = $("<div>")
                    .addClass("theme-description")
                    .text(theme.description);
                var $installButton = $("<button>")
                    .text("Install")
                    .addClass("install-button")
                    .click(function () {
                        installTheme(theme.file);
                    })
                    .data("file", theme.file);
                var $removeButton = $("<button>")
                    .text("Remove")
                    .addClass("remove-button")
                    .click(function () {
                        removeTheme(theme.file);
                    });
                $themeItem
                    .append($themeTitle)
                    .append($themeDescription)
                    .append($installButton)
                    .append($removeButton);
                $themeList.append($themeItem);
                if (
                    localStorage.getItem("installedThemes") &&
                    JSON.parse(
                        localStorage.getItem("installedThemes")
                    ).includes(theme.file)
                ) {
                    $installButton
                        .text("Installed")
                        .addClass("installed-button")
                        .prop("disabled", true);
                }
            });

            var $customThemeItem = $("<li>");
            var $customThemeTitle = $("<div>").html(
                'Custom Theme by <span class="theme-author">fierce</span>'
            );
            var $customThemeDescription = $("<div>")
                .addClass("theme-description")
                .text("Create your own custom theme.");
            var $customThemeButton = $("<button>")
                .text("Edit")
                .addClass("custom-theme-button")
                .click(function () {
                    openCustomEditor("theme");
                });
            var $clearCustomThemeButton = $("<button>")
                .text("Clear")
                .addClass("clear-custom-theme-button")
                .click(function () {
                    clearCustomTheme();
                });
            $customThemeItem
                .append($customThemeTitle)
                .append($customThemeDescription)
                .append($customThemeButton)
                .append($clearCustomThemeButton);
            $themeList.append($customThemeItem);
        });
    }

    function loadPlugins() {
        $.getJSON("./plugins.json", function (data) {
            $pluginList.empty();
            data.plugins.forEach(function (plugin) {
                var $pluginItem = $("<li>");
                var $pluginTitle = $("<div>").html(
                    plugin.name +
                        ' by <span class="plugin-author">' +
                        plugin.author +
                        "</span>"
                );
                var $pluginDescription = $("<div>")
                    .addClass("plugin-description")
                    .text(plugin.description);
                var $installButton = $("<button>")
                    .text("Install")
                    .addClass("install-button")
                    .click(function () {
                        installPlugin(plugin.file);
                    })
                    .data("file", plugin.file);
                var $removeButton = $("<button>")
                    .text("Remove")
                    .addClass("remove-button")
                    .click(function () {
                        removePlugin(plugin.file);
                    });
                $pluginItem
                    .append($pluginTitle)
                    .append($pluginDescription)
                    .append($installButton)
                    .append($removeButton);
                $pluginList.append($pluginItem);
                if (
                    localStorage.getItem("installedPlugins") &&
                    JSON.parse(
                        localStorage.getItem("installedPlugins")
                    ).includes(plugin.file)
                ) {
                    $installButton
                        .text("Installed")
                        .addClass("installed-button")
                        .prop("disabled", true);
                }
            });

            var $customPluginItem = $("<li>");
            var $customPluginTitle = $("<div>").html(
                'Custom Plugin by <span class="plugin-author">fierce</span>'
            );
            var $customPluginDescription = $("<div>")
                .addClass("plugin-description")
                .text("Create your own custom plugin.");
            var $customPluginButton = $("<button>")
                .text("Edit")
                .addClass("custom-plugin-button")
                .click(function () {
                    openCustomEditor("plugin");
                });
            var $clearCustomPluginButton = $("<button>")
                .text("Clear")
                .addClass("clear-custom-plugin-button")
                .click(function () {
                    clearCustomPlugin();
                });
            $customPluginItem
                .append($customPluginTitle)
                .append($customPluginDescription)
                .append($customPluginButton)
                .append($clearCustomPluginButton);
            $pluginList.append($customPluginItem);

            // Refresh message
            var $refreshMessage = $(
                '<div class="refresh-message">Some plugins may require a refresh to activate or deactivate <a href="#" id="refresh-link">click here to refresh</a>.</div>'
            );
            $pluginWindow.prepend($refreshMessage);

            // Fix: Ensure refresh link works
            $(document).on("click", "#refresh-link", function (event) {
                event.preventDefault();
                location.reload();
            });
        });
    }

    function installTheme(themeFile) {
        $("<link>")
            .attr("rel", "stylesheet")
            .attr("href", "themes/" + themeFile)
            .appendTo("head");
        var installedThemes = localStorage.getItem("installedThemes")
            ? JSON.parse(localStorage.getItem("installedThemes"))
            : [];
        installedThemes.push(themeFile);
        localStorage.setItem(
            "installedThemes",
            JSON.stringify(installedThemes)
        );
        updateInstallButtons();
    }

    function removeTheme(themeFile) {
        $('link[rel=stylesheet][href="themes/' + themeFile + '"]').remove();
        var installedThemes = localStorage.getItem("installedThemes")
            ? JSON.parse(localStorage.getItem("installedThemes"))
            : [];
        installedThemes = installedThemes.filter(function (theme) {
            return theme !== themeFile;
        });
        localStorage.setItem(
            "installedThemes",
            JSON.stringify(installedThemes)
        );
        updateInstallButtons();
    }

    function installPlugin(pluginFile) {
        $.getScript("plugins/" + pluginFile)
            .done(function () {
                var installedPlugins = localStorage.getItem("installedPlugins")
                    ? JSON.parse(localStorage.getItem("installedPlugins"))
                    : [];
                installedPlugins.push(pluginFile);
                localStorage.setItem(
                    "installedPlugins",
                    JSON.stringify(installedPlugins)
                );
                updateInstallButtons();
            })
            .fail(function () {
                console.error("Failed to load plugin: " + pluginFile);
            });
    }

    function removePlugin(pluginFile) {
        $('script[src="plugins/' + pluginFile + '"]').remove();
        var installedPlugins = localStorage.getItem("installedPlugins")
            ? JSON.parse(localStorage.getItem("installedPlugins"))
            : [];
        installedPlugins = installedPlugins.filter(function (plugin) {
            return plugin !== pluginFile;
        });
        localStorage.setItem(
            "installedPlugins",
            JSON.stringify(installedPlugins)
        );
        updateInstallButtons();
    }

    function updateInstallButtons() {
        var installedThemes = localStorage.getItem("installedThemes")
            ? JSON.parse(localStorage.getItem("installedThemes"))
            : [];
        $themeList.find("li").each(function () {
            var $installButton = $(this).find(".install-button");
            if ($installButton.length) {
                var themeFile = $installButton.data("file");
                if (installedThemes.includes(themeFile)) {
                    $installButton
                        .text("Installed")
                        .addClass("installed-button")
                        .prop("disabled", true);
                } else {
                    $installButton
                        .text("Install")
                        .removeClass("installed-button")
                        .prop("disabled", false);
                }
            }
        });

        var installedPlugins = localStorage.getItem("installedPlugins")
            ? JSON.parse(localStorage.getItem("installedPlugins"))
            : [];
        $pluginList.find("li").each(function () {
            var $installButton = $(this).find(".install-button");
            if ($installButton.length) {
                var pluginFile = $installButton.data("file");
                if (installedPlugins.includes(pluginFile)) {
                    $installButton
                        .text("Installed")
                        .addClass("installed-button")
                        .prop("disabled", true);
                } else {
                    $installButton
                        .text("Install")
                        .removeClass("installed-button")
                        .prop("disabled", false);
                }
            }
        });
    }

    function openCustomEditor(type) {
        if (!customEditorWindow || customEditorWindow.closed) {
            currentEditorType = type;
            customEditorWindow = window.open(
                "",
                "Custom " + (type === "theme" ? "Theme" : "Plugin") + " Editor",
                "width=800,height=600,scrollbars=yes,resizable=yes"
            );
            customEditorWindow.document.write(`
                <html>
                <head>
                    <title>Custom ${
                        type === "theme" ? "Theme" : "Plugin"
                    } Editor</title>
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/codemirror.min.css">
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/theme/dracula.min.css">
                    <style>
                        body { background-color: #282a36; color: #f8f8f2; font-family: Arial, sans-serif; padding: 20px; }
                        .CodeMirror { height: 300px; }
                        input[type="text"] { width: 100%; padding: 10px; margin-bottom: 10px; background-color: #44475a; color: #f8f8f2; border: none; }
                        button { padding: 10px 20px; background-color: #6272a4; color: white; border: none; cursor: pointer; }
                        button:hover { background-color: #50fa7b; }
                        .editor-container { margin-bottom: 20px; }
                    </style>
                </head>
                <body>
                    <div class="editor-container">
                        <textarea id="customCode" placeholder="Write your custom ${
                            type === "theme" ? "theme" : "plugin"
                        } code here..."></textarea>
                        <button onclick="applyCustomCode()">Apply</button>
                        <button onclick="clearCustomCode()">Clear</button>
                    </div>
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/codemirror.min.js"></script>
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/mode/css/css.min.js"></script>
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/mode/javascript/javascript.min.js"></script>
                    <script>
                        var editor = CodeMirror.fromTextArea(document.getElementById('customCode'), {
                            mode: '${type === "theme" ? "css" : "javascript"}',
                            theme: 'dracula',
                            lineNumbers: true
                        });

                        if (localStorage.getItem('custom${
                            type === "theme" ? "Theme" : "Plugin"
                        }Code')) {
                            editor.setValue(localStorage.getItem('custom${
                                type === "theme" ? "Theme" : "Plugin"
                            }Code'));
                        }

                        function applyCustomCode() {
                            var codeContent = editor.getValue();
                            localStorage.setItem('custom${
                                type === "theme" ? "Theme" : "Plugin"
                            }Code', codeContent);
                            window.opener.applyCustomCode(codeContent, '${type}');
                        }

                        function clearCustomCode() {
                            editor.setValue('');
                            localStorage.removeItem('custom${
                                type === "theme" ? "Theme" : "Plugin"
                            }Code');
                            window.opener.clearCustomCode('${type}');
                        }
                    </script>
                </body>
                </html>
            `);
            customEditorWindow.document.close();
        } else {
            customEditorWindow.focus();
        }
    }

    function clearCustomTheme() {
        $("style#custom-theme").remove();
        $('link[rel=stylesheet][href^="custom"]').remove();
        localStorage.removeItem("customThemeCode");
    }

    function clearCustomPlugin() {
        $('script[src^="custom"]').remove();
        localStorage.removeItem("customPluginCode");
    }

    window.applyCustomCode = function (codeContent, type) {
        if (type === "theme") {
            $("style#custom-theme").remove();
            $('<style id="custom-theme">').text(codeContent).appendTo("head");
        } else if (type === "plugin") {
            $('script[src^="custom"]').remove();
            var script = document.createElement("script");
            script.type = "text/javascript";
            script.text = codeContent;
            document.head.appendChild(script);
        }
    };

    function closeCustomEditor() {
        if (customEditorWindow && !customEditorWindow.closed) {
            customEditorWindow.close();
        }
    }

    $themeButton.click(function () {
        $themeWindow.toggle();
        if ($themeWindow.is(":visible")) {
            $pluginWindow.hide();
            $themeButton.addClass("active");
            $pluginButton.removeClass("active");
        }
    });

    $pluginButton.click(function () {
        $pluginWindow.toggle();
        if ($pluginWindow.is(":visible")) {
            $themeWindow.hide();
            $pluginButton.addClass("active");
            $themeButton.removeClass("active");
        }
    });

    $(document).click(function (event) {
        if (
            !$(event.target).closest(
                "#themeButton, #pluginButton, #themeWindow, #pluginWindow"
            ).length
        ) {
            $themeButton.removeClass("active");
            $pluginButton.removeClass("active");
            $themeWindow.hide();
            $pluginWindow.hide();
        }
    });

    loadThemes();
    loadPlugins();

    if (localStorage.getItem("installedThemes")) {
        JSON.parse(localStorage.getItem("installedThemes")).forEach(function (
            themeFile
        ) {
            installTheme(themeFile);
        });
    }

    if (localStorage.getItem("installedPlugins")) {
        JSON.parse(localStorage.getItem("installedPlugins")).forEach(function (
            pluginFile
        ) {
            installPlugin(pluginFile);
        });
    }

    if (localStorage.getItem("customThemeCode")) {
        applyCustomCode(localStorage.getItem("customThemeCode"), "theme");
    }

    if (localStorage.getItem("customPluginCode")) {
        applyCustomCode(localStorage.getItem("customPluginCode"), "plugin");
    }
});
