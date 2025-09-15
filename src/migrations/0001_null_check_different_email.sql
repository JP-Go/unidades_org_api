ALTER TABLE "node" DROP CONSTRAINT "user_email_uq";--> statement-breakpoint
CREATE UNIQUE INDEX "edge_uq" ON "edges" USING btree ("parent_id","child_id");--> statement-breakpoint
ALTER TABLE "node" ADD CONSTRAINT "user_email_uq" UNIQUE("email");