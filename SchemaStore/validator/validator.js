﻿/// <reference path="http://geraintluff.github.io/tv4/tv4.js" />
/// <reference path="http://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.js" />

(function () {
    //$.ajaxSetup({ cache: false });

    function createTextEditor(textarea) {
        return CodeMirror.fromTextArea(textarea, {
            mode: { name: "javascript", json: true },
            lineNumbers: true,
            indentUnit: 4,
        });
    }

    var select = document.querySelector("select");
    var schema = createTextEditor(document.getElementById("schema"));
    var json = createTextEditor(document.getElementById("json"));
    var toggle = document.getElementById("toggle");
    var output = document.querySelector("output");
    var header = document.getElementById("jsonheader");
    var valid = document.getElementById("valid");

    function onSelectChange() {

        if (select.selectedIndex > 0)
            location.hash = select.options[select.selectedIndex].value;
        else
            location.hash = "";
    }

    function loadSchema() {

        if (select.selectedIndex === 0) {
            schema.setValue("");
            toggleEditor(true);
            clear();
        }
        else {
            var url = select.options[select.selectedIndex].value;

            $.get(url, null, function (data) {
                schema.setValue(data);
                validate();
            });
        }
    }

    function toggleSchema() {
        var visible = schema.getWrapperElement().style.visibility === "hidden";
        toggleEditor(visible);
        return false;
    }

    function toggleEditor(visible) {
        var element = schema.getWrapperElement();
        element.style.height = visible ? "" : "0px";
        element.style.visibility = visible ? "visible" : "hidden";
        toggle.innerHTML = visible ? "Hide schema" : "Show schema";
        localStorage.toggle = visible;
    }

    function loadSelect() {
        $.getJSON("/api/json/catalog.json", null, function (data) {

            for (var i = 0; i < data.schemas.length; i++) {

                var schema = data.schemas[i];

                if (schema.url.indexOf("schemastore.org") < 0)
                    continue;

                var option = document.createElement("option");
                option.text = schema.name;
                option.value = schema.url.replace("http://schemastore.org", "");

                if (location.hash === "#" + option.value) {
                    option.selected = "selected";
                }

                select.querySelector("optgroup").appendChild(option);
            }

            loadSchema();
        });
    }

    function validate() {

        var jsonValue = json.getValue();
        var schemaValue = schema.getValue();

        if (jsonValue.trim().length == 0 || jsonValue.trim().length == 0)
            clear();

        if (!IsJsonString(jsonValue) || !IsJsonString(schemaValue)) {
            valid.style.visibility = "visible";
            return;
        }

        localStorage.json = jsonValue;

        var result = tv4.validateMultiple(JSON.parse(jsonValue), JSON.parse(schemaValue), true);

        if (result.valid) {
            clear();
            output.innerHTML = "Congrats! The JSON validates against the schema";
            output.className = "true";
            jsonheader.className = "true";
            jsonheader.innerHTML = "JSON: No errors found."
        }
        else {
            var errors = "";
            for (var i = 0; i < result.errors.length; i++) {

                var error = result.errors[i];
                errors += "<dl>";

                if (error.dataPath)
                    errors += "<dd>Data path</dd><dt>#" + error.dataPath + "</dt>";

                errors += "<dd>Message</dd><dt>" + error.message + "</dt>";
                errors += "<dd>Schema path</dd><dt>#" + error.schemaPath + "</dt>";
                errors += "</dl>";
            }

            output.innerHTML = errors;
            output.className = "false";
            jsonheader.className = "false";
            jsonheader.innerHTML = "JSON: Found " + result.errors.length + " error(s)."
            jsonheader.className = "false";
        }

        valid.style.visibility = "hidden";
    }

    function clear() {
        jsonheader.className = "";
        jsonheader.innerHTML = "JSON:"
        jsonheader.className = "";
        output.className = "";
        output.innerHTML = "";
    }

    function IsJsonString(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }

    $(function () {

        json.setValue(localStorage.json || "{\n\t\n}");

        if (localStorage.toggle === "false")
            toggleEditor(false);

        if (location.hash === "")
            toggleEditor(true);

        select.onchange = onSelectChange;
        schema.on("change", validate);
        json.on("change", validate);
        toggle.onclick = toggleSchema;
        window.onhashchange = loadSchema;
    });

    loadSelect();

})();