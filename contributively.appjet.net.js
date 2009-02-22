/* appjet:version 0.1 */
import('storage');

if (!storage.names) {
    storage.names = new StorableCollection();
}

function post_main() {
    var name = request.params.name;
    if(name) {
        storage.names.forEach(function(item) {
            item.position++;
        });
        storage.names.add({
            name:name,
            position:1
        });
        response.write(name+' added successfully');
    } else {
        response.write('no name POSTed');
    }
}

function get_main() {
    if(storage.names.size()!==0) {
        storage.names.sortBy("position").forEach(function(item) {
            print(P(item.name));
        });
    } else {
        print(P("no names saved yet"));
    }
}

dispatch();