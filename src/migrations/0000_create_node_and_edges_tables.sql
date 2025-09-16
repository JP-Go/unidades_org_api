CREATE TABLE "edges" (
	"id" uuid PRIMARY KEY NOT NULL,
	"parent_id" uuid NOT NULL,
	"child_id" uuid NOT NULL,
	"depth" integer
);
--> statement-breakpoint
CREATE TABLE "node" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"email" varchar(300),
	"type" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_email_uq" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "edges" ADD CONSTRAINT "edges_parent_id_node_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."node"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edges" ADD CONSTRAINT "edges_child_id_node_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."node"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "edge_uq" ON "edges" USING btree ("parent_id","child_id");