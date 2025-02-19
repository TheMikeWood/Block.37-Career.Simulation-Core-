require("dotenv").config();

const {
  client,
  createTables,
  createUser,
  createItem,
  createReview,
  createComment,
} = require("./db.js");

const seed = async () => {
  try {
    await client.connect();
    console.log("creating tables...");
    await createTables();
    console.log("tables created!");
    // Seed users
    console.log("Seeding users...");
    const [moe, lucy, larry, ethyl] = await Promise.all([
      createUser("moe", "moe_pw"),
      createUser("lucy", "lucy_pw"),
      createUser("larry", "larry_pw"),
      createUser("ethyl", "ethyl_pw"),
    ]);
    console.log("Users seeded!");

    // Seed items
    console.log("Seeding items...");
    const [gatsby, shoes, pasta] = await Promise.all([
      createItem("The Great Gatsby", "A classic novel by F. Scott Fitzgerald."),
      createItem(
        "Nike Running Shoes",
        "Lightweight and comfortable running shoes."
      ),
      createItem("Pasta Palace", "A family-owned Italian restaurant."),
    ]);
    console.log("Items seeded!");

    // Seed reviews
    console.log("Seeding reviews...");
    const [review1, review2, review3] = await Promise.all([
      createReview(moe.id, gatsby.id, 5, "An absolute masterpiece!"),

      createReview(lucy.id, shoes.id, 4, "Great comfort and style."),
      createReview(larry.id, pasta.id, 3, "Decent pasta, but a bit pricey."),
    ]);
    console.log("Reviews seeded!");

    // Seed comment
    console.log("Seeding comments...");
    await Promise.all([
      createComment(lucy.id, review1.id, "Totally agree!"),
      createComment(
        larry.id,
        review2.id,
        "Thanks for the review, I might buy these shoes now."
      ),
      createComment(
        ethyl.id,
        review3.id,
        "I had a similar experience at this restaurant."
      ),
    ]);
    console.log("Comments seeded!");

    client.end();
  } catch (error) {
    console.log(error);
  }
};

seed();
