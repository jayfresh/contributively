/* appjet:version 0.1 */
page.setMode("plain");
print(html("""

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <title>Contributively - peer-reviewed contributions to projects</title>
        <script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.3.1/jquery.min.js"></script>
        <script type="text/javascript" src="http://www.google.com/jsapi"></script>
        <script type="text/javascript">
          google.load("visualization", "1", {packages:["piechart"]});
          function drawPieChartForString(s) {
              var start = s.start;
              var end = s.end;
              var rows = end-start+1;
            var data = new google.visualization.DataTable();
            data.addColumn('string', 'Contribution');
            data.addColumn('number', 'Percentage');
            data.addRows(rows);
            var person;
            for(var i=0;i<rows;i++) {
                person = store[start+i];
                data.setValue(i, 0, person.name);
                data.setValue(i, 1, person.normalisedTotal);
            }
            var chart = new google.visualization.PieChart(document.getElementById('pieChart'));
            chart.draw(data, {width: 400, height: 240, is3D: true, title: 'Contributions'});
          }
        </script>
        <script type="text/javascript">
            var store = [];
            var calculateTotalsForString = function(s) {
                var start = s.start;
                var end = s.end;
                var person = store[start];
                var previousPerson;
                var ratio;
                var j = start+1;
                var unNormalisedTotal;
                // make everything relative to person at start of string
                var total = person['amountWith'+j];
                person.unNormalisedTotal = total;
                for(var i=j;i<end+1;i++) {
                    // only runs once there are two or more people in a string
                    previousPerson = person;
                    // should probably check that all browsers make array[0] the
                    // first element pushed in
                    person = store[i];
                    ratio = person['amountWith'+previousPerson.position] / previousPerson['amountWith'+person.position];
                    unNormalisedTotal = previousPerson.unNormalisedTotal * ratio;
                    person.unNormalisedTotal = unNormalisedTotal;
                    total += unNormalisedTotal;
                }
                var normalisedTotal;
                for(var i=start;i<end+1;i++) {
                    person = store[i];
                    normalisedTotal = person.unNormalisedTotal / total;
                    person.normalisedTotal = normalisedTotal;
                    $('#total'+person.position).html(normalisedTotal);
                }
                drawPieChartForString(s);
                /*saveStoreToWeb();*/
            };
            var calculateConnectedStrings = function() {
                var connectedStrings = [];
                var connectedString = {
                    start:0,
                    end:0
                };
                var j;
                for(var i=0;i<store.length;i++) {
                    j=i+1;
                    if(store[i]['amountWith'+j]) {
                        connectedString.end = j;
                    } else {
                        if(connectedString.end) {
                            connectedStrings.push(connectedString);
                        }
                        connectedString = {
                            start:j,
                            end:null
                        };
                    }
                }
                return connectedStrings;
            };
            var calculateTotalsFromStore = function() {
                var ss = calculateConnectedStrings();
                $('#pieChart').html('');
                for(var i=0;i<ss.length;i++) {
                    calculateTotalsForString(ss[i]);
                }
            };
            var saveStoreToWeb = function(successCallback) {
                successCallback = typeof successCallback === 'function' ? successCallback : function() {};
                var callback = function(response) {
                    if(response.indexOf("added successfully")!==-1) { // this is from appjet
                        $('#nameList .ajax').remove();
                        successCallback();
                    } else {
                        $('#nameList .ajax').addClass('error').html('Not saved to server! Try again.</div>');
                    }
                };
                $('#nameList').prepend('<div class="ajax">Saving...</div>');
                // handle viewing over local file:/// uri
                if(
                    window.Components &&
                    window.netscape &&
                    window.netscape.security &&
                    document.location.protocol.indexOf("http") == -1) {
                window.netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
                }
                $.post("http://contributively.appjet.net",store,callback,"html");
            };
            $(document).ready(function() {
                $('#nameForm .submit').click(function() {
                    var name = $('#name').val();
                    var addNameToTable = function() {
                        var table = $('#nameList tbody');
                        var people = $('#nameList tbody tr.person').length;
                        var htmlString = '<tr class="person"><td>'+name+'</td><td id="total'+people+'"></td></tr>';
                        if(people!==0) {
                            var id = $('#nameList input').length;
                            htmlString += '<tr><td><input type="text" id="'+(id+1)+'" /></td><td></td></tr><tr><td><input type="text" id="'+id+'" /></td><td></td></tr>';
                        }
                        table.prepend(htmlString);
                    };
                    store.push({
                        name:name,
                        position:store.length
                    });
                    addNameToTable();
                    /*saveStoreToWeb();*/
                    return false;
                });
                $('#nameList').change(function(ev) {
                    var target = ev.target;
                    var id = parseInt(target.id,10);
                    var partnerInputId = id%2===0 ? id+1 : id-1;
                    var position = Math.floor((id+1)/2);
                    var partnerPosition = Math.floor((partnerInputId+1)/2);
                    var amount = target.value;
                    if(target.value==='') {
                        amount = target.value = '0';
                    }
                    var updateInput = function() {
                        // check to see its only digits and less than or equal to 100
                        if(amount.match(/^\d+$/) && amount <= 100) {
                            var partnerInput = $('#'+partnerInputId);
                            partnerInput.val(100-amount);
                        }
                    };
                    for(var i=0;i<store.length;i++) {
                        if(store[i].position===position) {
                            store[i]['amountWith'+partnerPosition] = amount;
                        } else if(store[i].position===partnerPosition) {
                            store[i]['amountWith'+position] = 100-amount;
                        }
                    }
                    updateInput();
                    if(store.length>=2) {
                        calculateTotalsFromStore();
                    }
                    /*saveStoreToWeb();*/
                });
            });
        </script>
    </head>
    <body>
        <div id="container">
            <div id="nameForm">
                <form action="/">
                    <label for="name">Add name</label>
                    <input id="name" type="text"></input>
                    <input type="submit" class="submit" value="Add"></input>
                </form>
            </div>
            <div id="nameList">
                <table border="1">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Totals</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
                <div id="pieChart"></div>
            </div>
        </div>
    </body>
</html>


"""));