var $, Base, Collection, CouchAjax, Extend, Include, Model, Singleton, _;
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
  for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
  function ctor() { this.constructor = child; }
  ctor.prototype = parent.prototype;
  child.prototype = new ctor;
  child.__super__ = parent.prototype;
  return child;
};
if (typeof Spine === "undefined" || Spine === null) {
  Spine = require('spine/core');
}
$ = Spine.$;
Model = Spine.Model;
_ = require("underscore")._;
Spine.Model.include({
  toJSON: function() {
    var key, result, _i, _len, _ref;
    result = {};
    _ref = this.constructor.attributes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      key = _ref[_i];
      if (key in this) {
        if (typeof this[key] === 'function') {
          result[key] = this[key]();
        } else {
          result[key] = this[key];
        }
      }
    }
    if (this._id) {
      result.id = result._id = this._id;
    }
    return result;
  }
});
Spine.Model.extend({
  fromJSON: function(objects) {
    var value, _i, _len, _results;
    if (!objects) {
      return;
    }
    if (typeof objects === 'string') {
      objects = JSON.parse(objects);
    }
    if (Spine.isArray(objects)) {
      _results = [];
      for (_i = 0, _len = objects.length; _i < _len; _i++) {
        value = objects[_i];
        if (!value.id) {
          value.id = value._id;
        }
        if (!value._id) {
          value._id = value.id;
        }
        _results.push(new this(value));
      }
      return _results;
    } else {
      if (!objects.id) {
        objects.id = objects._id;
      }
      if (!objects._id) {
        objects._id = objects.id;
      }
      return new this(objects);
    }
  }
});
CouchAjax = {
  getURL: function(object) {
    return object && (typeof object.url === "function" ? object.url() : void 0) || object.url;
  },
  enabled: true,
  pending: false,
  requests: [],
  disable: function(callback) {
    this.enabled = false;
    callback();
    return this.enabled = true;
  },
  requestNext: function() {
    var next;
    next = this.requests.shift();
    if (next) {
      return this.request(next);
    } else {
      return this.pending = false;
    }
  },
  request: function(callback) {
    return (callback()).complete(__bind(function() {
      return this.requestNext();
    }, this));
  },
  queue: function(callback) {
    if (!this.enabled) {
      return;
    }
    if (this.pending) {
      this.requests.push(callback);
    } else {
      this.pending = true;
      this.request(callback);
    }
    return callback;
  }
};
Base = (function() {
  function Base() {}
  Base.prototype.defaults = {
    contentType: 'application/json',
    dataType: 'json',
    processData: false,
    headers: {
      'X-Requested-With': 'XMLHttpRequest'
    }
  };
  Base.prototype.ajax = function(params, defaults) {
    return $.ajax($.extend({}, this.defaults, defaults, params));
  };
  Base.prototype.queue = function(callback) {
    return CouchAjax.queue(callback);
  };
  return Base;
})();
Collection = (function() {
  __extends(Collection, Base);
  function Collection(model) {
    this.model = model;
    this.errorResponse = __bind(this.errorResponse, this);
    this.recordsResponse = __bind(this.recordsResponse, this);
  }
  Collection.prototype.find = function(id, params) {
    var record;
    record = new this.model({
      id: id
    });
    return this.ajax(params, {
      type: 'GET',
      url: CouchAjax.getURL(record)
    }).success(this.recordsResponse).error(this.errorResponse);
  };
  Collection.prototype.all = function(params) {
    return this.ajax(params, {
      type: 'GET',
      url: CouchAjax.getURL(this.model)
    }).success(this.recordsResponse).error(this.errorResponse);
  };
  Collection.prototype.fetch = function(params) {
    var id;
    if (params == null) {
      params = {};
    }
    if (id = params.id) {
      delete params.id;
      return this.find(id, params).success(__bind(function(record) {
        return this.model.refresh(record);
      }, this));
    } else {
      return this.all(params).success(__bind(function(records) {
        return this.model.refresh(_.pluck(records.rows, "doc"));
      }, this));
    }
  };
  Collection.prototype.recordsResponse = function(data, status, xhr) {
    return this.model.trigger('ajaxSuccess', null, status, xhr);
  };
  Collection.prototype.errorResponse = function(xhr, statusText, error) {
    return this.model.trigger('ajaxError', null, xhr, statusText, error);
  };
  return Collection;
})();
Singleton = (function() {
  __extends(Singleton, Base);
  function Singleton(record) {
    this.record = record;
    this.errorResponse = __bind(this.errorResponse, this);
    this.recordResponse = __bind(this.recordResponse, this);
    this.model = this.record.constructor;
  }
  Singleton.prototype.reload = function(params, options) {
    return this.queue(__bind(function() {
      return this.ajax(params, {
        type: 'GET',
        url: CouchAjax.getURL(this.record)
      }).success(this.recordResponse(options)).error(this.errorResponse(options));
    }, this));
  };
  Singleton.prototype.create = function(params, options) {
    return this.queue(__bind(function() {
      return this.ajax(params, {
        type: 'POST',
        data: JSON.stringify(this.record),
        url: CouchAjax.getURL(this.model)
      }).success(this.recordResponse(options)).error(this.errorResponse(options));
    }, this));
  };
  Singleton.prototype.update = function(params, options) {
    return this.queue(__bind(function() {
      return this.ajax(params, {
        type: 'PUT',
        data: JSON.stringify(this.record),
        url: CouchAjax.getURL(this.record)
      }).success(this.recordResponse(options)).error(this.errorResponse(options));
    }, this));
  };
  Singleton.prototype.destroy = function(params, options) {
    return this.queue(__bind(function() {
      return this.ajax(params, {
        type: 'DELETE',
        url: CouchAjax.getURL(this.record)
      }).success(this.recordResponse(options)).error(this.errorResponse(options));
    }, this));
  };
  Singleton.prototype.recordResponse = function(options) {
    if (options == null) {
      options = {};
    }
    return __bind(function(data, status, xhr) {
      var _ref;
      if (Spine.isBlank(data)) {
        data = false;
      } else if (data.rows) {
        data = this.model.fromJSON(_.pluck(data.rows, "doc"));
      } else {
        data = this.model.fromJSON(data);
      }
      CouchAjax.disable(__bind(function() {
        if (data) {
          if (data.id && this.record.id !== data.id) {
            this.record.changeID(data.id);
          }
          return this.record.updateAttributes(data.attributes());
        }
      }, this));
      this.record.trigger('ajaxSuccess', data, status, xhr);
      return (_ref = options.success) != null ? _ref.apply(this.record) : void 0;
    }, this);
  };
  Singleton.prototype.errorResponse = function(options) {
    if (options == null) {
      options = {};
    }
    return __bind(function(xhr, statusText, error) {
      var _ref;
      this.record.trigger('ajaxError', xhr, statusText, error);
      return (_ref = options.error) != null ? _ref.apply(this.record) : void 0;
    }, this);
  };
  return Singleton;
})();
Model.host = '';
Include = {
  ajax: function() {
    return new Singleton(this);
  },
  url: function() {
    var base;
    base = CouchAjax.getURL(this.constructor);
    if (base.charAt(base.length - 1) !== '/') {
      base += '/';
    }
    base += encodeURIComponent(this.id);
    return base;
  }
};
Extend = {
  ajax: function() {
    return new Collection(this);
  },
  url: function() {
    return "" + Model.host + "/" + (this.className.toLowerCase());
  }
};
Model.CouchAjax = {
  extended: function() {
    this.fetch(this.ajaxFetch);
    this.change(this.ajaxChange);
    this.extend(Extend);
    return this.include(Include);
  },
  ajaxFetch: function() {
    var _ref;
    return (_ref = this.ajax()).fetch.apply(_ref, arguments);
  },
  ajaxChange: function(record, type, options) {
    if (options == null) {
      options = {};
    }
    return record.ajax()[type](options.ajax, options);
  }
};
Model.CouchAjax.Methods = {
  extended: function() {
    this.extend(Extend);
    return this.include(Include);
  }
};
CouchAjax.defaults = Base.prototype.defaults;
Spine.CouchAjax = CouchAjax;
if (typeof module !== "undefined" && module !== null) {
  module.exports = CouchAjax;
}