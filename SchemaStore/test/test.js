﻿/// <reference path="http://geraintluff.github.io/tv4/tv4.min.js" />
/// <reference path="http://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js" />

(function () {
    $.ajaxSetup({ cache: false });

    var list = document.getElementById("result");
    var progress = document.querySelector("progress");
    var results = [];

    function runTest(name, files) {

        var schemaUrl = "../schemas/json/" + name + ".json";

        $.getJSON(schemaUrl, null, function (schema) {
            var gets = [];

            for (var i = 0; i < files.length; i++) {

                gets.push($.getJSON("/" + files[i], null, function (file) {
                    var result = tv4.validateMultiple(file, schema);
                    result.url = cleanUrl(this.url);
                    result.name = name;
                    results.push(result);
                }));
            }

            $.when.apply($, gets).then(function () {
                progress.value = 1 + progress.value;
            });
        });
    }

    function cleanUrl(url) {

        if (url.indexOf("/test/") === 0)
            url = url.substring(6);

        var index = url.indexOf("?");

        if (index > -1) {
            return url.substring(0, index);
        }

        return url;
    }

    function sortResults(a, b) {
        if (a.name > b.name) {
            return (a.url > b.url) ? 1 : -1;
        }
        else if (a.name < b.name) {
            return (a.url > b.url) ? 1 : -1;
        }

        return (a.url > b.url) ? 1 : -1;
    }

    $(document).ajaxStop(function () {

        results.sort(sortResults);

        list.innerHTML = "";

        var last = "";
        var ul = null;

        for (var i = 0; i < results.length; i++) {
            var result = results[i];

            if (result.name != last) {
                ul = document.createElement("ul");
                var cat = document.createElement("li");
                cat.innerHTML = result.name;
                ul.appendChild(cat);
                list.appendChild(ul);
            }

            last = result.name;

            var a = document.createElement("a");
            a.innerHTML = result.url;
            a.href = result.url;
            a.className = result.valid;

            var li = document.createElement("li");
            li.appendChild(a);

            if (!result.valid) {
                var error = result.errors.map(function (e) { return "<strong>" + e.schemaPath + "</strong>: " + e.message }).join("<br />");
                var msg = document.createElement("span");
                msg.innerHTML = error;
                li.appendChild(msg);
            }

            ul.appendChild(li);
        }
    });

    $.getJSON("tests.json", null, function (data) {

        var count = (Object.keys(data).length - 2);
        list.innerHTML = "Testing " + count + " JSON Schemas...";
        progress.max = count;

        for (var test in data) {
            if (test === "catalog" || test == "schemas")
                continue;

            var name = test.replace("_", ".");
            var files = data[test].src;
            runTest(name, files);
        }
    });
})();