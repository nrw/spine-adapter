module.exports = [  

  from: "/model/:id"
  to: "_update/model/:id"
  
,

  from: "/:modelname"
  to: "_view/docs_by_modelname"
  query:
    start_key: [":modelname"]
    end_key: [":modelname", {}]
    include_docs: "true"

]