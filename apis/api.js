const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const verifytoken = require("../services/servise");
const Joi = require("joi");
const { Service, CreateCategory } = require("../model/schemaCategory");

router.post("/login", (req, res) => {
  const verifyLogin = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
  });

  try {
    const validationResult = verifyLogin.validate(req.body);

    if (validationResult.error) {
      throw new Error(validationResult.error.details[0].message);
    }

    if (validationResult.value.email !== "admin@codesfortomorrow.com") {
      throw new Error("Please Enter Valid Email");
    }

    if (validationResult.value.password !== "Admin123!@#") {
      throw new Error("Please Enter Valid Password");
    }
    const token = jwt.sign({ foo: "bar" }, "abc", { expiresIn: "1h" });

    res.json({
      status: "success",
      message: "You have succesfully Login!",
      data: {
        token,
      },
    });
  } catch (error) {
    res.json({ status: "Failed", message: error.message });
  }
});

router.post("/category", verifytoken, async (req, res) => {
  const addCategorySchema = Joi.object({
    categoryName: Joi.string().required(),
    serviceName: Joi.string().optional(),
    price: Joi.number().optional(),
    duration: Joi.string().optional(),
  });

  try {
    const validationResult = addCategorySchema.validate(req.body);
    if (validationResult.error) {
      throw new Error(validationResult.error.details[0].message);
    }
    const categoryExists = await CreateCategory.findOne({
      categoryName: validationResult.value.categoryName,
    });
    if (categoryExists) {
      throw new Error("This catogry already Exits");
    }
    if (validationResult.value.serviceName) {
      const service1 = new Service({
        serviceName: validationResult.value.categoryName,
        price: validationResult.value.price,
        duration: validationResult.value.duration,
      });
      const creatCategory = new CreateCategory({
        categoryName: validationResult.value.categoryName,
        services: [service1],
      });
      creatCategory
        .save()
        .then((savedCategory) => {
          console.log("Category Saved Succesfully!", savedCategory);
        })
        .catch((error) => {
          console, log("Error Saving category", error);
        });
      res.status(200).json({ massge: "You have succesfully Add a Category!" });
    } else {
      const creatCategory = new CreateCategory({
        categoryName: validationResult.value.categoryName,
        services: [],
      });
      creatCategory
        .save()
        .then((savedCategory) => {
          console.log("Category Saved Succesfully!", savedCategory);
        })
        .catch((error) => {
          console, log("Error Saving category", error);
        });
      res.status(200).json({ massge: "You have succesfully Add a Category!" });
    }
  } catch (error) {
    res.json({ status: "Failed", message: error.message });
  }
});

router.get("/categories", verifytoken, async (req, res) => {
  try {
    const categories = await CreateCategory.find();
    res.json({ status: "Sucess", massage: categories });
  } catch (error) {
    res.json({ status: "Failed", message: error.message });
  }
});

router.put("/category/:categoryId", verifytoken, async (req, res) => {
  const updateCategorySchema = Joi.object({
    categoryName: Joi.string().optional(),
    serviceName: Joi.string().optional(),
    price: Joi.number().optional(),
    duration: Joi.string().optional(),
  });

  try {
    const validationResult = updateCategorySchema.validate(req.body);
    if (validationResult.error) {
      throw new Error(validationResult.error.details[0].message);
    }
    const categoryId = req.params.categoryId;
    const category = await CreateCategory.findById(categoryId);
    if (!category) {
      throw new Error("Category not found");
    }
    const categoryExists = await CreateCategory.findOne({
      categoryName: validationResult.value.categoryName,
    });
    if (categoryExists) {
      throw new Error("This catogry already Exits");
    }
    if (validationResult.value.categoryName) {
      category.categoryName = validationResult.value.categoryName;
    }
    if (
      validationResult.value.serviceName ||
      validationResult.value.price ||
      validationResult.value.duration
    ) {
      const service = {
        serviceName:
          validationResult.value.serviceName || category.services.serviceName,
        price: validationResult.value.price || category.services.price,
        duration: validationResult.value.duration || category.services.duration,
      };
      category.services = service;
    }
    const updatedCategory = await category.save();
    res.status(200).json({
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    res.json({ status: "Failed", message: error.message });
  }
});

router.delete("category/:categoryId", verifytoken, async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const category = await CreateCategory.findById(categoryId);
    if (!category) {
      throw new Error("Category not found");
    }
    if (category.services.length === 0) {
      await CreateCategory.findByIdAndDelete(categoryId);
      res.status(200).json({ message: "Category Deleted successfully" });
    } else {
      res
        .status(400)
        .json({ message: "Category has services, cannot be delete" });
    }
  } catch (error) {
    res.status(400).json({ status: "Failed", message: error.message });
  }
});

router.post("category/:categoryId/service", verifytoken, async (req, res) => {
  const serviceSchema = Joi.object({
    serviceName: Joi.string().required(),
    price: Joi.number().required(),
    duration: Joi.string().required(),
  });

  try {
    const validationResult = serviceSchema.validate(req.body);
    if (validationResult.error) {
      throw new Error(validationResult.error.details[0].message);
    }
    const categoryId = req.params.categoryId;
    const category = await CreateCategory.findById(categoryId);
    if (!category) {
      throw new Error("Category not found");
    }
    const newService = new Service({
      serviceName: validationResult.value.serviceName,
      price: validationResult.value.price,
      duration: validationResult.value.duration,
    });
    category.services.push(newService);
    await category.save();

    res
      .status(200)
      .json({ message: "Service added successfully", service: newService });
  } catch (error) {
    res.json({ status: "Failed", message: error.message });
  }
});

router.get("/category/:categoryId/services", async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const category = await CreateCategory.findById(categoryId);
    if (!category) {
      throw new Error("Category not found");
    }
    const services = category.services;
    res.status(200).json({ services });
  } catch (error) {
    res.status(400).json({ status: "Failed", message: error.message });
  }
});

router.delete(
  "/category/:categoryId/service/:serviceId",
  verifytoken,
  async (req, res) => {
    try {
      const categoryId = req.params.categoryId;
      const serviceId = req.params.serviceId;

      const category = await CreateCategory.findById(categoryId);
      if (!category) {
        throw new Error("Category not found");
      }
      const serviceIndex = category.services.findIndex(
        (service) => service._id == serviceId
      );
      if (serviceIndex === -1) {
        throw new Error("Service not found in this category");
      }
      category.services.splice(serviceIndex, 1);
      await category.save();
      res.status(200).json({
        message: "Service removed successfully",
        category: category.services,
      });
    } catch (error) {
      res.status(400).json({ status: "Failed", message: error.message });
    }
  }
);

router.put(
  "/category/:categoryId/service/:serviceId",
  verifytoken,
  async (req, res) => {
    try {
      const categoryId = req.params.categoryId;
      const serviceId = req.params.serviceId;

      const category = await CreateCategory.findById(categoryId);
      if (!category) {
        throw new Error("Category not found");
      }
      const service = category.services.find(
        (service) => service._id == serviceId
      );
      if (!service) {
        throw new Error("Service not found in this category");
      }
      if (req.body.serviceName) {
        service.serviceName = req.body.serviceName;
      }
      if (req.body.priceOptions) {
        service.priceOptions = req.body.priceOptions;
      }
      await category.save();

      res
        .status(200)
        .json({ message: "Service updated successfully", service });
    } catch (error) {
      res.status(400).json({ status: "Failed", message: error.message });
    }
  }
);

module.exports = router;
