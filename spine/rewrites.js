module.exports = [
  {
    from: "/:modelname",
    to: "_update/model",
    method: "POST"
  }, {
    from: "/:modelname/:id",
    to: "_update/model/:id",
    method: "PUT"
  }, {
    from: "/:modelname/:id",
    to: "_update/model/:id",
    method: "DELETE"
  }, {
    from: "/:modelname",
    to: "_view/docs_by_modelname",
    method: "GET",
    query: {
      start_key: [":modelname"],
      end_key: [":modelname", {}],
      include_docs: "true"
    }
  }
];