const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const serviceSchema = new Schema({
  serviceName: {
    type: String,
    require: false,
  },
  price: {
    type: Number,
    require: false,
  },
  duration: {
    type: String,
    require: false,
  },
});

const creatCategorySchema = new Schema({
  categoryName: {
    type: String,
    require: true,
  },
  services: [serviceSchema],
});

const Service = mongoose.model("Service", serviceSchema);
const CreateCategory = mongoose.model("CreateCategory", creatCategorySchema);

module.exports = { Service, CreateCategory };
