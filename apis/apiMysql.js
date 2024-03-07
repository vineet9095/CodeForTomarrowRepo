const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const verifytoken = require("../services/servise");
const Joi = require("joi");
const connection = require("../mySqlDatabase");

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
      throw new Error("Invalid email or password");
    }

    if (validationResult.value.password !== "Admin123!@#") {
      throw new Error("Invalid email or password");
    }

    const token = jwt.sign({ foo: "bar" }, "abc", { expiresIn: "1h" });

    res.json({
      status: "success",
      message: "You have successfully logged in!",
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
    const categoryExistsQuery =
      "SELECT * FROM categories WHERE categoryName = ?";
    connection.query(
      categoryExistsQuery,
      [validationResult.value.categoryName],
      (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
          throw new Error("This category already exists");
        } else {
          let insertQuery;
          if (validationResult.value.serviceName) {
            insertQuery = "INSERT INTO categories (categoryName) VALUES (?)";
            const values = [validationResult.value.categoryName];
            connection.query(insertQuery, [values], (err, result) => {
              if (err) throw err;
              const categoryId = result.insertId;
              const serviceInsertQuery =
                "INSERT INTO services (categoryId, serviceName, price, duration) VALUES (?, ?, ?, ?)";
              const serviceValues = [
                categoryId,
                validationResult.value.serviceName,
                validationResult.value.price,
                validationResult.value.duration,
              ];
              connection.query(
                serviceInsertQuery,
                serviceValues,
                (err, result) => {
                  if (err) throw err;
                  console.log("Category and Service added successfully");
                  res.status(200).json({
                    message: "You have successfully added a Category!",
                  });
                }
              );
            });
          } else {
            insertQuery = "INSERT INTO categories (categoryName) VALUES (?)";
            const values = [validationResult.value.categoryName];
            connection.query(insertQuery, [values], (err, result) => {
              if (err) throw err;
              console.log("Category added successfully");
              res
                .status(200)
                .json({ message: "You have successfully added a Category!" });
            });
          }
        }
      }
    );
  } catch (error) {
    res.json({ status: "Failed", message: error.message });
  }
});

router.get("/categories", verifytoken, (req, res) => {
  try {
    const query = "SELECT * FROM categories";
    connection.query(query, (error, results) => {
      if (error) {
        throw new Error("Database error");
      }
      res.json({ status: "Success", message: results });
    });
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

    const getCategoryQuery = "SELECT * FROM categories WHERE id = ?";
    connection.query(getCategoryQuery, [categoryId], async (error, results) => {
      if (error) {
        throw new Error("Database error");
      }

      if (results.length === 0) {
        throw new Error("Category not found");
      }

      const category = results[0];

      if (validationResult.value.categoryName) {
        const categoryExistsQuery =
          "SELECT * FROM categories WHERE categoryName = ? AND id != ?";
        connection.query(
          categoryExistsQuery,
          [validationResult.value.categoryName, categoryId],
          async (error, results) => {
            if (error) {
              throw new Error("Database error");
            }

            if (results.length > 0) {
              throw new Error("This category already exists");
            }

            category.categoryName = validationResult.value.categoryName;
          }
        );
      }
      if (
        validationResult.value.serviceName ||
        validationResult.value.price ||
        validationResult.value.duration
      ) {
        category.serviceName =
          validationResult.value.serviceName || category.serviceName;
        category.price = validationResult.value.price || category.price;
        category.duration =
          validationResult.value.duration || category.duration;
      }
      const updateCategoryQuery =
        "UPDATE categories SET categoryName = ?, serviceName = ?, price = ?, duration = ? WHERE id = ?";
      connection.query(
        updateCategoryQuery,
        [
          category.categoryName,
          category.serviceName,
          category.price,
          category.duration,
          categoryId,
        ],
        async (error, results) => {
          if (error) {
            throw new Error("Database error");
          }

          res.status(200).json({
            message: "Category updated successfully",
            category: category,
          });
        }
      );
    });
  } catch (error) {
    res.json({ status: "Failed", message: error.message });
  }
});

router.delete("/category/:categoryId", verifytoken, (req, res) => {
  try {
    const categoryId = req.params.categoryId;

    const getCategoryQuery = "SELECT * FROM categories WHERE id = ?";
    connection.query(getCategoryQuery, [categoryId], async (error, results) => {
      if (error) {
        throw new Error("Database error");
      }

      if (results.length === 0) {
        throw new Error("Category not found");
      }

      const category = results[0];
      if (category.services.length === 0) {
        const deleteCategoryQuery = "DELETE FROM categories WHERE id = ?";
        connection.query(
          deleteCategoryQuery,
          [categoryId],
          async (error, results) => {
            if (error) {
              throw new Error("Database error");
            }

            res.status(200).json({ message: "Category deleted successfully" });
          }
        );
      } else {
        res
          .status(400)
          .json({ message: "Category has services, cannot be deleted" });
      }
    });
  } catch (error) {
    res.status(400).json({ status: "Failed", message: error.message });
  }
});

router.post("/category/:categoryId/service", verifytoken, (req, res) => {
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
    const getCategoryQuery = "SELECT * FROM categories WHERE id = ?";
    connection.query(getCategoryQuery, [categoryId], async (error, results) => {
      if (error) {
        throw new Error("Database error");
      }

      if (results.length === 0) {
        throw new Error("Category not found");
      }

      const category = results[0];
      const newServiceQuery =
        "INSERT INTO services (categoryId, serviceName, price, duration) VALUES (?, ?, ?, ?)";
      connection.query(
        newServiceQuery,
        [
          categoryId,
          validationResult.value.serviceName,
          validationResult.value.price,
          validationResult.value.duration,
        ],
        async (error, results) => {
          if (error) {
            throw new Error("Database error");
          }

          const newServiceId = results.insertId;

          res.status(200).json({
            message: "Service added successfully",
            service: { id: newServiceId, ...validationResult.value },
          });
        }
      );
    });
  } catch (error) {
    res.json({ status: "Failed", message: error.message });
  }
});

router.get("/category/:categoryId/services", verifytoken, async (req, res) => {
  try {
    const categoryId = req.params.categoryId;

    const getCategoryQuery = "SELECT * FROM categories WHERE id = ?";
    connection.query(getCategoryQuery, [categoryId], async (error, results) => {
      if (error) {
        throw new Error("Database error");
      }

      if (results.length === 0) {
        throw new Error("Category not found");
      }

      const category = results[0];
      const getServicesQuery = "SELECT * FROM services WHERE categoryId = ?";
      connection.query(
        getServicesQuery,
        [categoryId],
        async (error, results) => {
          if (error) {
            throw new Error("Database error");
          }
          const services = results;
          res.status(200).json({ services });
        }
      );
    });
  } catch (error) {
    res.status(400).json({ status: "Failed", message: error.message });
  }
});

router.delete(
  "/category/:categoryId/service/:serviceId",
  verifytoken,
  (req, res) => {
    try {
      const categoryId = req.params.categoryId;
      const serviceId = req.params.serviceId;

      const getCategoryQuery = "SELECT * FROM categories WHERE id = ?";
      connection.query(
        getCategoryQuery,
        [categoryId],
        async (error, results) => {
          if (error) {
            throw new Error("Database error");
          }

          if (results.length === 0) {
            throw new Error("Category not found");
          }

          const category = results[0];

          const getServiceQuery =
            "SELECT * FROM services WHERE id = ? AND categoryId = ?";
          connection.query(
            getServiceQuery,
            [serviceId, categoryId],
            async (error, results) => {
              if (error) {
                throw new Error("Database error");
              }

              if (results.length === 0) {
                throw new Error("Service not found in this category");
              }

              const deleteServiceQuery =
                "DELETE FROM services WHERE id = ? AND categoryId = ?";
              connection.query(
                deleteServiceQuery,
                [serviceId, categoryId],
                async (error, results) => {
                  if (error) {
                    throw new Error("Database error");
                  }

                  res
                    .status(200)
                    .json({ message: "Service removed successfully" });
                }
              );
            }
          );
        }
      );
    } catch (error) {
      res.status(400).json({ status: "Failed", message: error.message });
    }
  }
);

router.put(
  "/category/:categoryId/service/:serviceId",
  verifytoken,
  (req, res) => {
    try {
      const categoryId = req.params.categoryId;
      const serviceId = req.params.serviceId;

      const getCategoryQuery = "SELECT * FROM categories WHERE id = ?";
      connection.query(
        getCategoryQuery,
        [categoryId],
        async (error, results) => {
          if (error) {
            throw new Error("Database error");
          }

          if (results.length === 0) {
            throw new Error("Category not found");
          }

          const category = results[0];

          const getServiceQuery =
            "SELECT * FROM services WHERE id = ? AND categoryId = ?";
          connection.query(
            getServiceQuery,
            [serviceId, categoryId],
            async (error, results) => {
              if (error) {
                throw new Error("Database error");
              }

              if (results.length === 0) {
                throw new Error("Service not found in this category");
              }

              const service = results[0];

              if (req.body.serviceName) {
                service.serviceName = req.body.serviceName;
              }
              if (req.body.priceOptions) {
                service.priceOptions = req.body.priceOptions;
              }

              const updateServiceQuery =
                "UPDATE services SET serviceName = ?, priceOptions = ? WHERE id = ? AND categoryId = ?";
              connection.query(
                updateServiceQuery,
                [
                  service.serviceName,
                  service.priceOptions,
                  serviceId,
                  categoryId,
                ],
                async (error, results) => {
                  if (error) {
                    throw new Error("Database error");
                  }

                  res
                    .status(200)
                    .json({ message: "Service updated successfully", service });
                }
              );
            }
          );
        }
      );
    } catch (error) {
      res.status(400).json({ status: "Failed", message: error.message });
    }
  }
);
module.exports = router;
