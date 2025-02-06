// controllers/hoots.js

const express = require("express");
const verifyToken = require("../middleware/verify-token.js");
const Hoot = require("../models/hoot.js");
const router = express.Router();

// /////////////////
// HOOT ROUTES
// ////////////////////

router.get('/', verifyToken, async (req, res) => {
  try {
    const hoots = await Hoot.find({}) // find all of the Hoots
      .populate('author') // populate author property with associate username for stored user._id
      .sort({ createdAt: 'desc' }); // sort by newest Hoots first

    res.status(200).json(hoots);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

router.get('/:hootId', verifyToken, async (req, res) => {
  try {
    // find Hoot
    const hoot = await Hoot.findById(req.params.hootId).populate([
      'author',
      'comments.author',
    ]);

    // issue JSON response
    res.status(200).json(hoot);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    // define author key with req.user._id
    req.body.author = req.user._id;

    // create the Hoot with contents of request body.
    const hoot = await Hoot.create(req.body);

    // update MongoDB doc with referred user
    hoot._doc.author = req.user;

    // issue JSON response
    res.status(201).json(hoot);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

router.put('/:hootId', verifyToken, async (req, res) => {
  try {
    // find the Hoot
    const hoot = await Hoot.findById(req.params.hootId);

    // check permissions
    if (!hoot.author.equals(req.user._id)) {
      res.status(403).send("You're not allowed to do that!")
    }

    // update Hoot
    const updatedHoot = await Hoot.findByIdAndUpdate(
      req.params.hootId,
      req.body,
      { new: true }
    );

    // Append req.user to the author property
    updatedHoot._doc.author = req.user;

    // Issue JSON response
    res.status(200).json(updatedHoot);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

router.delete('/:hootId', verifyToken, async (req, res) => {
  try {
    // find the Hoot
    const hoot = await Hoot.findById(req.params.hootId);

    // check permissions
    if (!hoot.author.equals(req.user._id)) {
      res.status(403).send("You're not allowed to do that!");
    }

    // delete Hoot
    const deletedHoot = await Hoot.findByIdAndDelete(req.params.hootId);

    // Issue JSON response
    res.status(200).json(deletedHoot)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
})

// /////////////////
// HOOT COMMENT ROUTES
// ////////////////////

router.post('/:hootId/comments', verifyToken, async (req, res) => {
  try {
    // append the author key with the active user.
    req.body.author = req.user._id;

    // find the Hoot
    const hoot = await Hoot.findById(req.params.hootId);

    // push the contents of the request body to the comments property of the Hoot 
    hoot.comments.push(req.body);

    // save the comment to the database
    await hoot.save();

    // find the newly created comment
    const newComment = hoot.comments[hoot.comments.length - 1];

    // append the author property with a user object
    newComment._doc.author = req.user;

    // issue JSON response with newComment
    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

router.put('/:hootId/comments/:commentId', verifyToken, async (req, res) => {
  try {
    // get the parent hoot object
    const hoot = await Hoot.findById(req.params.hootId);
    //sets comment to the comment in our hoot with the id of our param
    const comment = hoot.comments.id(req.params.commentId);

    // ensures current user is the author of the comment.
    if (comment.author.toString() !== req.user._id) {
      res.status(403).json({ err: 'You are not authorized to edit this comment!' });
    }

    // set the comment to the test key of req.body
    comment.text = req.body.text;
    await hoot.save();
    res.status(200).json({ message: 'Comment updated successfully!' });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
})

router.delete('/:hootId/comments/:commentId', verifyToken, async (req, res) => {
  try {
    const hoot = await Hoot.findById(req.params.hootId)
    const comment = hoot.comments.id(req.params.commentId)
    if (comment.author.toString() !== req.user._id) {
      res.status(403).json({ message: 'You are not authorized to delete this comment' })
    }
    hoot.comments.remove({ _id: req.params.commentId })
    await hoot.save()
    res.status(200).json({ message: 'Comment deleted successfully!' })
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
})

module.exports = router;
