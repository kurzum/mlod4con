;
(function($, window, document, undefined) {

//global variables

    var queryName = "dbpedia-query"; //name of the query, used to select the query in the queries array.
    var markupTemplates = ""; //template to output markup. If not set by the user the template defined for a query is used.
    var mlod4consettings = new Array(); //the settings: queries and markup templates.
    var mlod4consettings = jsonObject;
    var query = new Array(); //the query: SPARQL endpoint + query string.
    var content = ""; //the textual content of the element that is processed.
    var language = "default"; //the language for markup templates and language filters in SPARQL queries. default is English and can be set to other languages.
    var entityIdentifier = ""; // the identifier used for querying linked data sources. 
    var outputMarkupType = "0"; //0 means microdata, 1 means rdfa, 2 means json-ld.
    var output = new Array(); //Array of markup generated. Always two items: LD identifier + markup.

//Private functions

//Redefining string class for string replacement
    String.prototype.replaceAll = function(str1, str2, ignore)
    {
        return this.replace(new RegExp(str1.replace(/([\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, function(c) {
            return "\\" + c;
        }), "g" + (ignore ? "i" : "")), str2);
    };

    var generateXML = function() {
        var xmlStart = "<settings>";
        var queryXML = "";
        $.each(mlod4consettings.queries, function(queryID, queryInfo) {
            queryXML = queryXML + "\n <query>\n  <name>" + queryInfo.name + "</name>";
            queryXML = queryXML + "\n  <endpoint>" + queryInfo.endpoint + "</endpoint>";
            queryXML = queryXML + "\n  <queryTemplate>" + queryInfo.queryTemplate.replaceAll("<", "&lt;") + "</queryTemplate>";
            var relevantT = queryInfo.relevantTemplates.split(',');
            $.each(relevantT, function(index, item) {
                queryXML = queryXML + "\n  <relevantTemplate>" + item.trim() + "</relevantTemplate>";
            });
            queryXML = queryXML + "\n </query>";
        });
        var markupXML = "";
        $.each(mlod4consettings.outputMarkupTemplates, function(templateID, templateInfo) {
            markupXML = markupXML + "\n <markupTemplate>\n <name>" + templateInfo.type + "</name>";
            markupXML = markupXML + "\n <language>" + templateInfo.language + "</language>";
            markupXML = markupXML + "\n <mappings>" + templateInfo.mappings + "</mappings>";
            markupXML = markupXML + "\n <rdfa>" + templateInfo.rdfa.replaceAll("<", "&lt;") + "</rdfa>";
            markupXML = markupXML + "\n <microdata>" + templateInfo.microdata.replaceAll("<", "&lt;") + "</microdata>";
            markupXML = markupXML + "\n <json-ld>" + templateInfo.jsonld.replaceAll("<", "&lt;") + "</json-ld>\n</markupTemplate>";
        });
        var xmlEnd = "\n</settings>";
        var complete = xmlStart + queryXML + markupXML + xmlEnd;
        $('textarea[name="myfield"]').val(complete);
        return complete;
    };

    var generateHTML = function() {
        var htmlStart = "<p>Queries</p>\n<table width=100% border=1>\n<tr class='th'><td>query name</td><td>endpoint</td><td>query string</td><td>related templates</td></tr>";
        var queryHTML = "";
        $.each(mlod4consettings.queries, function(queryID, queryInfo) {
            queryHTML = queryHTML + "\n <tr>\n  <td>" + queryInfo.name + "</td>";
            queryHTML = queryHTML + "\n  <td>" + queryInfo.endpoint + "</td>";
            queryHTML = queryHTML + "\n  <td>" + queryInfo.queryTemplate.replaceAll("<", "&lt;") + "</td>";
            queryHTML = queryHTML + "\n  <td> " + queryInfo.relevantTemplates + "</td>";
            queryHTML = queryHTML + "\n </tr>";
        });
        var markupHTML = "</table><p>Templates</p>";
        markupHTML = markupHTML + "<table width=100% border=1>\n<tr><td>type</td><td>language</td><td>mappings</td><td>RDFa</td><td>microdata</td></tr>";
        $.each(mlod4consettings.outputMarkupTemplates, function(templateID, templateInfo) {
            markupHTML = markupHTML + "\n <tr>\n <td>" + templateInfo.type + "</td>";
            markupHTML = markupHTML + "\n <td>" + templateInfo.language + "</td>";
            markupHTML = markupHTML + "\n <td>" + templateInfo.mappings + "</td>";
            markupHTML = markupHTML + "\n <td>" + templateInfo.rdfa.replaceAll("<", "&lt;") + "</td>";
            markupHTML = markupHTML + "\n <td>" + templateInfo.microdata.replaceAll("<", "&lt;") + "</td>\n</tr>";
        });
        var htmlEnd = "</table>";
        var complete = htmlStart + queryHTML + markupHTML + htmlEnd;
        return complete;
    };

//for people who want to use data-mlod4con attributes
    var addListeners = function() {
        var elementsWithLd2mData = $("*[data-mlod4con]");
        $.each(elementsWithLd2mData, function(index) {
            var onclickString = "";
            var currentElem = $(this);
            var dataattr = $(currentElem).attr('data-mlod4con');
            var parameters = dataattr.split(';');
            $.each(parameters, function(indexP, item) {
                var parameterType = item.substring(0, item.indexOf('=')).trim();
                var parameterValue = item.substring(item.indexOf('=') + 1, item.length).trim();
                switch (parameterType) {
                    case "markupTemplates":
                        onclickString = onclickString + "$.mlod4con.setMarkupTemplates(" + parameterValue + ");";
                        break;
                    case "language" :
                        onclickString = onclickString + "$.mlod4con.setLanguage(" + parameterValue + ");";
                        break;
                    case "outputMarkupType" :
                        onclickString = onclickString + "$.mlod4con.setOutputMarkupType(" + parameterValue + ");";
                }
                ;
            });
            onclickString = onclickString + "$.mlod4con.run(this);";
            currentElem.attr("onclick", onclickString);
        });
    };


//get query from the settings file. Input is name of the query, output is query array with two items: sparql endpoint + query string.    
    var getQuery = function() {
        $.each(mlod4consettings.queries, function(index, element) {
            if (element.name.toString() === queryName) {
                query[0] = element.queryTemplate.toString().replaceAll("@@@entity@@@", entityIdentifier);
                if (language !== "default") {
                    query[0] = query[0].replaceAll("@@@language@@@", language);
                } else {
                    query[0] = query[0].replaceAll("@@@language@@@", "en");
                }
                ;
                query[1] = element.endpoint;
                if (element.relevantTemplates && markupTemplates === "") {
                    markupTemplates = element.relevantTemplates;
                } else
                    (console.log("using user templates: ") + markupTemplates);
            }
        });
        return query;
    }
    ;

//execute the query. Input is the query array obtained via getQuery. If ajax request is succesful, matchTemplatesToQueryResult is called.
    var executeQuery = function(query) {
        var sparlQuery = query[0].toString();
        var endpoint = query[1].toString();
        var request = $.getJSON(endpoint, {
            query: sparlQuery,
            format: "application/json"
        }).done(function(response) {
            var currentResult = [];
            var bindings = response.results.bindings;
            $.each(bindings, function(i, binding) {
                var currentItem = {};
                $.each(binding, function(e, currentBinding) {
                    currentItem[e] = currentBinding.value;
                });
                currentResult[i] = currentItem;
            });
            matchTemplatesToQueryResult(currentResult);
        })
                .fail(function() {
                    $('textarea[name="myfield"]').val("Linked Data Query had no result.");
                });
    };

//named entity annotation, tbd: change regex to be general, same for getLabelsQuery.
    var getEntityID = function(element) {
        var entityRegEx = new RegExp('^http://dbpedia.org/resource/');
        var query = getQuery(queryName);
        var getLabelsEndpoint = query[1];
        var getLabelsQuery = "select distinct ?entityID where {?entityID <http://www.w3.org/2000/01/rdf-schema#label> '###content###'@###language###.\n } LIMIT 100";
        content = $(element).text();
        getLabelsQuery = getLabelsQuery.replaceAll("###content###", content);
        getLabelsQuery = getLabelsQuery.replaceAll("###language###", "en");
        var request = $.getJSON(getLabelsEndpoint, {
            query: getLabelsQuery,
            format: "application/json"
        }).done(function(response) {
            var entityIDList = [];
            var bindings = response.results.bindings;
            $.each(bindings, function(i, binding) {
                $.each(binding, function(e, currentBinding) {
                    if (entityRegEx.test(currentBinding.value)) {
                        entityIDList.push(currentBinding.value);
                    }
                    ;
                });
            });
            $.each(entityIDList, function(entityID, value) {
                entityIdentifier = value;
                run(element);
            });
        })
                .fail(function() {
                    $('textarea[name="myfield"]').val("Linked Data Query had no result.");
                });
                        reset();
    };

//get the relevant templates. Name of template may come from query setting or from the user, to be set via setMarkupTemplates public method.
    var getRelevantTemplates = function() {
        var relevantTemplates = [];
        var currentUserTemplates = markupTemplates.split(",");
        $.each(currentUserTemplates, function(index, element) {
            $.each(mlod4consettings.outputMarkupTemplates, function(index, currentTemplate) {
                if (currentTemplate.type.toString().replace(/ /g, '') === element.replace(/ /g, ''))
                {
                    relevantTemplates.push(currentTemplate);
                }
                ;
            });
        });
        return relevantTemplates;
    }
    ;

// find the relevant type from the output, by looking at the markup templates. query output needs to contain ?type variable in output. select only the query sub set result based on first type found.
    var matchTemplatesToQueryResult = function(currentResults) {
        var relevantResults = [];
        var templateToBeUsed = [];
        var relevantTemplates = getRelevantTemplates();
        $.each(currentResults, function(index, value) {
            //console.log(index);
            $.each(value, function(variableName, value) {
                if (variableName === "type") {
                    var currentQueryType = value;
                    $.each(relevantTemplates, function(index, currentTemplate) {
                        $.each(currentTemplate.mappings, function(mappingNo, mappingVal) {
                            if (currentQueryType === mappingVal) {
                                relevantResults.push(currentResults);
                                templateToBeUsed.push(currentTemplate);
                            }
                            ;
                        });
                    }
                    );
                }
                ;
            });
        });
        return writeMarkup(relevantResults, checkLanguage(templateToBeUsed));
    }
    ;

    var checkLanguage = function(currentTemplates) {
        var relevantLanguageTemplates = [];
        if (language === "default") {
            language = "en";
        }
        var subtags = language.split("-");
        $.each(currentTemplates, function(index, item) {
            var templateLanguage = item.language;
            if (templateLanguage === language) {
                relevantLanguageTemplates.push(item);
            } else {
                var myLanguageRange = language;
                var lastSubtag = subtags[subtags.length - 1];
                for (var i = subtags.length - 1; i >= 0; i--) {
                    myLanguageRange = myLanguageRange.substr(0, (myLanguageRange.length - subtags[i].length - 1));
                    if (templateLanguage === myLanguageRange) {
                        relevantLanguageTemplates.push(item);
                    }
                    ;
                }
                ;
                if (subtags.length === 1 && subtags[0] === myLanguageRange) {
                    relevantLanguageTemplates.push(item);
                }
                ;
            }
            ;
        });
        return(relevantLanguageTemplates[0]);
    }
    ;

    var writeMarkup = function(relevantResults, templateToBeUsed) {
        var templateFilled = "";
        var templateBits = [];
        switch (outputMarkupType) {
            case "0":
                templateBits = templateToBeUsed.microdata.split("##X##");
                break;
            case "1":
                templateBits = templateToBeUsed.rdfa.split("##X##");
                break;
            case "2":
                templateBits = templateToBeUsed.jsonld.split("##X##");
                break;
        }
        ;
        templateFilled = templateFilled + templateBits[0];
        $.each(templateBits, function(index, item) {
            var itemToFill = "";
            if (index > 0) {
                var position = item.toString().indexOf("##Y##");
                var variableKey = item.toString().substring(0, position);
                var bitRest = item.toString().substring(position + 5);
                $.each(relevantResults[0], function(index, value) {
                    if (value[variableKey].toString()) {
                        itemToFill = (value[variableKey].toString() + bitRest);
                    }
                    ;
                });
                templateFilled = templateFilled + itemToFill;
            }
            ;
        });
        templateFilled = templateFilled.replaceAll("@@@content@@@", content);
        templateFilled = templateFilled.replaceAll("@@@entityIdentifier@@@", entityIdentifier);
        $('textarea[name="myfield"]').val("");
        $('textarea[name="myfield"]').val(templateFilled);
        output.push(entityIdentifier, templateFilled);
        reset();
    }
    ;

    var form2Markup = function(inputelem) {
        var inputtext = inputelem.serialize();
        var entityString = inputtext.substring(inputtext.indexOf('=') + 1).replaceAll('+', ' ');
        var element = document.createElement('span');
        var myText = document.createTextNode(entityString);
        element.appendChild(myText);
        getEntityID(element);
    };

//public methods

    var reset = function() {
        queryName = "dbpedia-query"; //name of the query, used to select the query in the queries array.
        markupTemplates = ""; //template to output markup. If not set by the user the tempalte defined for a query is used.
        mlod4consettings = new Array(); //the settings: queries and markup templates.
        mlod4consettings = jsonObject;
        query = new Array(); //the query: SPARQL endpoint + query string.
        content = ""; //the textual content of the element that is processed.
        language = "default"; //the language for markup templates and language filters in SPARQL queries. default is English and can be set to other languages.
        entityIdentifier = ""; // the identifier used for querying linked data sources. 
        outputMarkupType = "0"; //0 means microdata, 1 means rdfa, 2 means json-ld.
        output = new Array(); //Array of markup generated. Always two items: LD identifier + markup.  
    };

    var setQuery = function(userQuery) {
        queryName = userQuery;
    };
    var setLanguage = function(userLanguage) {
        language = userLanguage;
    };
    var setMarkupTemplates = function(userMarkupTemplates) {
        markupTemplates = userMarkupTemplates;
        console.log("markup templates set by user: " + markupTemplates);
    };

    var setOutputMarkupType = function(userOutputMarkupType) {
        outputMarkupType = userOutputMarkupType;
    };

//executing everything
    var run = function(element) {
        if ($(element).attr("its-ta-ident-ref")) {
            entityIdentifier = $(element).attr("its-ta-ident-ref");
        }
        ;
        var query = getQuery(queryName);
        content = $(element).text();
        executeQuery(query);
        if (output.length > 0) {
            return output;
        } else
            ("Nothing found");
    };

//Define public methods
    $.mlod4con = {
        getEntityID: getEntityID,
        addListeners: addListeners,
        generateXML: generateXML,
        generateHTML: generateHTML,
        reset: reset,
        run: run,
        form2Markup: form2Markup,
        setQuery: setQuery,
        setMarkupTemplates: setMarkupTemplates,
        setOutputMarkupType: setOutputMarkupType,
        setLanguage: setLanguage
    };
}
)(jQuery, window, document);
