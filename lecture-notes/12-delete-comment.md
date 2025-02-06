# Hoot Back-End - Delete Comment

## Overview
In this section, we will create a delete route to find and delete a single comment within a hoot.

We will be following these specs when building the route:

- CRUD Action: DELETE
- Method: `DELETE`
- Path: `/hoots/:hootId/comments/:commentId`
- Response: JSON
- Success Status Code: `200` Ok
- Success Response Body: A JSON status message.
- Error Status Code: `500` Internal Server Error
- Error Response Body: A JSON object with an error key and a message describing the error

## Define the route
Our route will listen for `DELETE` requests on `/hoots/:hootId/comments/:commentId`:

```
DELETE /hoots/:hootId/comments/:commentId
```

Add the following to `controllers/hoots.js`:

```js
// controllers/hoots.js

router.delete("/:hootId/comments/:commentId", verifyToken, async (req, res) => {
  // add route
});
```

> 🧠 This route might be seem intimidating at first. It requires both a `hootId` a `commentId`, so that we can locate both the parent, and then the child document within it.

> ❗ A user needs to be logged in to update a comment, so be sure to include the `verifyToken` middleware.

## Code the controller function
Let’s breakdown what we’ll accomplish inside our controller function.

1. First we call upon the `Hoot` model’s `findById()` method. The retrieved `hoot` is the parent document that holds an array of `comments`. We’ll need to remove a specific comment from this array.

To do so, we’ll make use of the [MongooseArray.prototype.remove()](https://mongoosejs.com/docs/api/documentarray.html) method. This method is called on the array property of a document, and **removes** an embedded subdocument based on the provided query object (`{ _id: req.params.commentId }`).

2. After removing the subdocument, we save the parent `hoot` document, and issue a JSON response with a `message` of `Ok`.
Add the following to `controllers/hoots.js`:

```js
// controllers/hoots.js

router.delete("/:hootId/comments/:commentId", verifyToken, async (req, res) => {
  try {
    const hoot = await Hoot.findById(req.params.hootId);
    const comment = hoot.comments.id(req.params.commentId);

    // ensures the current user is the author of the comment
    if (comment.author.toString() !== req.user._id) {
      return res
        .status(403)
        .json({ message: "You are not authorized to edit this comment" });
    }

    hoot.comments.remove({ _id: req.params.commentId });
    await hoot.save();
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});
```

## Test the route in Postman
Now that we have finished the route let’s test it with Postman. We’ll do this by sending a `DELETE` request to `/hoots/:hootId/comments/:commentId`.

Create a new request in **Postman**. Let’s name this request **Delete Comment** and set its request type to `DELETE`. Your **Postman** URL should look something like this.

```
http://localhost:/hoots/63390dddff7c27bc4b86a1aa/comments/633915e08845c5a891cd4bf2
```

Your **Postman** request should look something like this:

![delete comment req](/public/images/delete-req.png)

The response should be an object containing a `message: "Comment deleted successfully"` property

![delete comment req](/public/images/delete-res.png)