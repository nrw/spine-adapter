## Example

A Kanso port of [spine.todos](https://github.com/maccman/spine.todos) lives [here](https://github.com/nrw/kanso-spine-todos).

## Usage

Add `spine-adapter` to your dependencies in `kanso.json` and run `kanso fetch`.

```javascript
"dependencies": {
    "spine-adapter": null
}
```

`require` Spine modules you'll use. `spine/core` is required for any use of Spine. `spine-adapter/couch-ajax` is required to persist your models in couchdb. `spine-adapter/couch-changes` is required to handle `_changes` feed.

```coffeescript
# Creates the global 'Spine' object
require("spine/core")
require("spine-adapter/couch-ajax")
require("spine-adapter/couch-changes")

class BlogPost extends Spine.Model
  @configure "BlogPost", "title", "body"

  # Enables CouchDB storage for instances of this model
  @extend Spine.Model.CouchAjax
  # Subscribes on _changes feed
  @extend Spine.Model.CouchChanges()
```

You may specify database url and override changes handler by passing options as an argument to CouchChanges

```coffeescript
class BlogPost extends Spine.Model
  ...
  @extend Spine.Model.CouchChanges
    url:     "/blogs"
    handler: Spine.Model.CouchChanges.PrivateChanges
```

Using of PrivateChanges handle will connect to `_changes` feed only when user is authenticated.

To fetch a specific set of records (rather than all records of a type), use the `db` module to retreive a view. Pass the docs from that view to the model's `refresh` method.

```coffeescript
require("db")
require("settings/root")
_ = require("underscore")._

query =
  include_docs: yes
  start_key: [1323286277322]
  end_key: [1323286977322, {}]

refresh = () ->
  appdb = db.use(require('duality/core').getDBURL())
  appdb.getView settings.name, "posts_by_date", query, (err, res) ->
    BlogPost.refresh(_.pluck(res.rows, "doc")) if res?.rows
```

Instantiate your Spine app controller in a script tag. In this example, the module at `controllers/app` exports a Spine controller.

```html
<!-- in base.html -->
...
<div id="content"></div>

<script type="text/javascript" charset="utf-8">
  var exports = this;
  jQuery(function(){
    var App = require("controllers/app");
    exports.new_app = new App({el: $("#content")});
  });
</script>
</body>
</html>
```

For full documentation of how to use Spine, visit its [official documentation](http://spinejs.com/docs/index).