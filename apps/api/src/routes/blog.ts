import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { wrap, HttpError } from "../middleware/error";
import { sendMail, notifyAdmin, mailTemplates } from "../lib/mailer";

export const blogRouter = Router();

blogRouter.get(
  "/",
  wrap(async (req, res) => {
    const q = z
      .object({ category: z.string().optional(), page: z.coerce.number().min(1).default(1) })
      .parse(req.query);
    const where = { published: true, ...(q.category ? { category: q.category } : {}) };
    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip: (q.page - 1) * 9,
        take: 9,
        select: { slug: true, title: true, excerpt: true, cover: true, category: true, publishedAt: true, authorName: true },
      }),
      prisma.blogPost.count({ where }),
    ]);
    res.json({ posts, total, pages: Math.ceil(total / 9) });
  })
);

blogRouter.get(
  "/:slug",
  wrap(async (req, res) => {
    const post = await prisma.blogPost.findUnique({
      where: { slug: req.params.slug },
      include: { comments: { where: { approved: true }, orderBy: { createdAt: "desc" } } },
    });
    if (!post || !post.published) throw new HttpError(404, "Post not found");
    const more = await prisma.blogPost.findMany({
      where: { published: true, slug: { not: post.slug }, category: post.category },
      take: 3,
      select: { slug: true, title: true, cover: true, category: true, publishedAt: true },
    });
    res.json({ post, more });
  })
);

blogRouter.post(
  "/:slug/comments",
  wrap(async (req, res) => {
    const body = z
      .object({ name: z.string().min(2).max(60), email: z.string().email(), body: z.string().min(3).max(1000) })
      .parse(req.body);
    const post = await prisma.blogPost.findUnique({ where: { slug: req.params.slug } });
    if (!post) throw new HttpError(404, "Post not found");
    await prisma.blogComment.create({ data: { ...body, postId: post.id } });
    void sendMail(body.email, "Thank you for your comment — Madhura Naturals", mailTemplates.commentReceived(body.name, post.title));
    notifyAdmin(`New blog comment on “${post.title}”`, mailTemplates.adminModeration("blog comment", `${body.name} <${body.email}>`, post.title, body.body));
    res.status(201).json({ ok: true, message: "Comment submitted for moderation" });
  })
);
