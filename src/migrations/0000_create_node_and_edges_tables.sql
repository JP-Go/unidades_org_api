CREATE TABLE "edges" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer NOT NULL,
	"child_id" integer NOT NULL,
	"depth" integer
);
--> statement-breakpoint
CREATE TABLE "node" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"email" varchar(300),
	"type" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_email_uq" UNIQUE NULLS NOT DISTINCT("email")
);
--> statement-breakpoint
ALTER TABLE "edges" ADD CONSTRAINT "edges_parent_id_node_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."node"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edges" ADD CONSTRAINT "edges_child_id_node_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."node"("id") ON DELETE no action ON UPDATE no action;