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
    const hoots = await Hoot.find({})
    .populate('author')
    .sort({createdAt: 'desc'});
    res.status(200).json(hoots);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

router.get('/:hootId', verifyToken, async (req, res) => {
  try {
    const hoot = await Hoot.findById(req.params.hootId).populate('author')
    await hoot.populate({path: 'comments', populate: {path: 'author'}})
    res.status(200).json(hoot)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
})

router.post('/', verifyToken, async (req, res) => {
  try {
    req.body.author = req.user._id;
    const hoot = await Hoot.create(req.body);
    hoot._doc.author = req.user;
    res.status(201).json(hoot);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

router.put('/:hootId', verifyToken, async (req, res) => {
  try {
    const hoot = await Hoot.findById(req.params.hootId)
    if(!hoot.author.equals(req.user._id)) {
      res.status(403).send("You're not allowed to do that!")
    }
    const updatedHoot = await Hoot.findByIdAndUpdate(
      req.params.hootId,
      req.body,
      {new: true}
    ).populate('author')
    res.status(200).json(updatedHoot)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
})

router.delete('/:hootId', verifyToken, async (req, res) => {
  try {
    const hoot = await Hoot.findById(req.params.hootId)
    if(!hoot.author.equals(req.user._id)) {
      res.status(403).send("You're not allowed to do that!")
    }
    const deletedHoot = await Hoot.findByIdAndDelete(req.params.hootId
    )
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
    const hoot = await Hoot.findById(req.params.hootId)
    req.body.author = req.user._id
    hoot.comments.push(req.body)
    hoot.save()

    const fullyPopulatedHoot = await hoot.populate({path: 'comments', populate: {path: 'author'}})

    const newComment = fullyPopulatedHoot.comments[hoot.comments.length - 1]

    res.status(201).json(newComment)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
})

router.put('/:hootId/comments/:commentId', verifyToken, async (req, res) => {
  try {
    const hoot = await Hoot.findById(req.params.hootId)
    const comment = hoot.comments.id(req.params.commentId)
    if(comment.author.toString() !== req.user._id) {
      res.status(403).json({ err: 'You are not authorized to edit this comment!'})
    }
    comment.text = req.body.text
    await hoot.save()
    res.status(200).json({message: 'Comment updated successfully!'})
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
})

router.delete('/:hootId/comments/:commentId', verifyToken, async (req, res) => {
  try{
    const hoot = await Hoot.findById(req.params.hootId)
    const comment = hoot.comments.id(req.params.commentId)
    if(comment.author.toString() !== req.user._id) {
      res.status(403).json({message: 'You are not authorized to delete this comment'})
    }
    hoot.comments.remove({_id: req.params.commentId})
    await hoot.save()
    res.status(200).json({message: 'Comment deleted successfully!'})
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
})

module.exports = router;
