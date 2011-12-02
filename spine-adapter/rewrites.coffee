

module.exports = [  

  from: "/spine-adapter/:modelname"
  to: "_update/spine_adapter_model"
  method: "POST"
,
  from: "/spine-adapter/:modelname/:id"
  to: "_update/spine_adapter_model/:id"
  method: "PUT"
,
  from: "/spine-adapter/:modelname/:id"
  to: "_update/spine_adapter_model/:id"
  method: "DELETE"
,
  from: "/spine-adapter/:modelname"
  to: "_view/spine_adapter_docs_by_modelname"
  method: "GET"
  query:
    start_key: [":modelname"]
    end_key: [":modelname", {}]
    include_docs: "true"

]