Spine ?= require('spine')
$      = Spine.$
Model  = Spine.Model
# settings = require("settings/root")
# db = require("db")

# console.log 
# Overrides "toJSON" of Models to make them work with couch.
Spine.Model.include
  toJSON: ->
    # The first part is copied from the default toJSON method in spine
    console.log 
    result = {}
    for key in @constructor.attributes when key of @
      if typeof @[key] is 'function'
        result[key] = @[key]()
      else
        result[key] = @[key]
    # Set the id as _id
    result._id = @id if @id
    result.modelname = @constructor.className.toLowerCase()
    # result.modelname = 
    # just like the default, return the result.
    result
  fromJSON: (objects) ->
    console.log "from json"
    return unless objects
    if typeof objects is 'string'
      objects = JSON.parse(objects)
    if isArray(objects)
      (new @(value) for value in objects)
    else
      console.log @
      new @(objects)

CouchAjax =
  getURL: (object) ->
    object and object.url?() or object.url

  enabled:  true
  pending:  false
  requests: []

  disable: (callback) ->
    @enabled = false
    do callback
    @enabled = true

  requestNext: ->
    next = @requests.shift()
    if next
      @request(next)
    else
      @pending = false

  request: (callback) ->
    (do callback).complete(=> do @requestNext)
      
  queue: (callback) ->
    return unless @enabled
    if @pending
      @requests.push(callback)
    else
      @pending = true
      @request(callback)    
    callback
    
class Base
  defaults:
    contentType: 'application/json'
    dataType: 'json'
    processData: false
    headers: {'X-Requested-With': 'XMLHttpRequest'}
  
  ajax: (params, defaults) ->
    $.ajax($.extend({}, @defaults, defaults, params))
    
  queue: (callback) ->
    CouchAjax.queue(callback)

class Collection extends Base
  constructor: (@model) -> 
    
  find: (id, params) ->
    record = new @model(id: id)
    @ajax(
      params,
      type: 'GET',
      url:  CouchAjax.getURL(record)
    ).success(@recordsResponse)
     .error(@errorResponse)
    
  all: (params) ->
    console.log "all"
    console.log CouchAjax.getURL(@model)
    @ajax(
      params,
      type: 'GET',
      url:  CouchAjax.getURL(@model)
    ).success(@recordsResponse)
     .error(@errorResponse)
    
  fetch: (params = {}) ->
    console.log "fetch"
    console.log params
    if id = params.id
      console.log "yes id"
      delete params.id
      @find(id, params).success (record) =>
        @model.refresh(record)
    else
      console.log "no id"
      @all(params)#.success (records) =>
        #@model.refresh(records)
    
  recordsResponse: (data, status, xhr) =>
    console.log "collection record response"
    # console.log xhr.responseText
    x = []
    for row in data.rows
      x.push row.doc

    @model.refresh(x)
      # console.log JSON.stringify(row.doc)
    # console.log x
    xhr.responseText = JSON.stringify(x)
    # console.log xhr.responseText
    @model.trigger('ajaxSuccess', null, status, xhr)

  errorResponse: (xhr, statusText, error) =>
    @model.trigger('ajaxError', null, xhr, statusText, error)
  

class Singleton extends Base
  constructor: (@record) ->
    @model = @record.constructor
  
  reload: (params, options) ->
    console.log "reload"
    console.log CouchAjax.getURL(@record)
    @queue =>
      @ajax(
        params,
        type: 'GET'
        url:  CouchAjax.getURL(@record)
      ).success(@recordResponse(options))
       .error(@errorResponse(options))
  
  create: (params, options) ->
    console.log require('duality/core').getDBURL()
    @queue =>
      console.log("create")
      @ajax(
        params,
        type: 'POST'
        data: JSON.stringify(@record)
        url:  require('duality/core').getDBURL() #CouchAjax.getURL(@model)
      ).success(@recordResponse(options))
       .error(@errorResponse(options))

  update: (params, options) ->
    console.log CouchAjax.getURL(@record)
    @queue =>
      @ajax(
        params,
        type: 'PUT'
        data: JSON.stringify(@record)
        url:  CouchAjax.getURL(@record)
      ).success(@recordResponse(options))
       .error(@errorResponse(options))
  
  destroy: (params, options) ->
    console.log CouchAjax.getURL(@record)
    @queue =>
      @ajax(
        params,
        type: 'DELETE'
        url:  CouchAjax.getURL(@record)
      ).success(@recordResponse(options))
       .error(@errorResponse(options))

  # Private

  recordResponse: (options = {}) =>
    console.log "records"
    (data, status, xhr) =>
      log data
      log status
      log xhr
      if Spine.isBlank(data)
        data = false
      else if xhr.rows
        log xhr.rows
        data = @model.fromJSON(xhr.rows)
      else
        console.log data.id
        # data = @model.fromJSON(data)
        @queue =>
          @ajax(
            type: 'GET'
            url: require('duality/core').getDBURL() + "/#{data.id}"
          ).success(@getRecordsResponse(options))
           .error(@errorResponse(options))
    
      # CouchAjax.disable =>
      #   if data
      #     # ID change, need to do some shifting
      #     if data.id and @record.id isnt data.id
      #       @record.changeID(data.id)

      #     # Update with latest data
      #     @record.updateAttributes(data.attributes())
        
      # @record.trigger('ajaxSuccess', data, status, xhr)
      # options.success?.apply(@record)
  getRecordsResponse: (options = {}) =>
    (xhr, statusText, error) =>
      log "got records"
      console.log xhr
      console.log statusText
      console.log error
      @model.fromJSON(xhr)
  
  errorResponse: (options = {}) =>
    console.log "error"
    (xhr, statusText, error) =>
      @record.trigger('ajaxError', xhr, statusText, error)
      options.error?.apply(@record)

# CouchAjax endpoint
Model.host = ''

Include =
  ajax: -> new Singleton(this)

  url: ->
    base = CouchAjax.getURL(@constructor)
    base += '/' unless base.charAt(base.length - 1) is '/'
    base += encodeURIComponent(@id)
    base
    
Extend = 
  ajax: -> new Collection(this)

  url: ->
    "#{Model.host}/#{@className.toLowerCase()}"
      
Model.CouchAjax =
  extended: ->
    @fetch @ajaxFetch
    @change @ajaxChange
    
    @extend Extend
    @include Include
    
  ajaxFetch: ->
    @ajax().fetch(arguments...)
    
  ajaxChange: (record, type, options = {}) ->
    record.ajax()[type](options.ajax, options)
    
Model.CouchAjax.Methods = 
  extended: ->
    @extend Extend
    @include Include
    
# Globals
CouchAjax.defaults   = Base::defaults
Spine.CouchAjax      = CouchAjax
module?.exports = CouchAjax