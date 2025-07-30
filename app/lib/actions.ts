    "use server";  
  
 import postgres from "postgres";
  import { z } from "zod";
  import { revalidatePath } from "next/cache";
  import { redirect } from "next/navigation";

  //Connect to the database
    const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });
  
  export async function createInvoice(formData: FormData) {


    const rawFormData = {
      customerId: formData.get("customerId"),
      amount: formData.get("amount"),
      status: formData.get("status"),
    };
    // validate form data with zod
    const FormSchema = z.object({
      id: z.string(),
      customerId: z.string(),
      amount: z.coerce.number(),
      status: z.enum(["pending", "paid"]),
      date: z.string(),
    });

    const CreateInvoive = FormSchema.omit({ id: true, date: true });

    const { customerId, amount, status } = CreateInvoive.parse(rawFormData);

    //Convert amount to cents
    const amountInCents = amount * 100;
    //Add date in ISO format
    const date = new Date().toISOString().split("T")[0];

    // Create invoice data object
    const invoiceData = {
      customerId,
      amount: amountInCents,
      status,
      date,
    };
    // Send invoiceData to the server or API

    //Insert the invoice into the database
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${invoiceData.customerId}, ${invoiceData.amount}, ${invoiceData.status}, ${invoiceData.date})`;

    //Revalidate the invoices cache
    revalidatePath("/dashboard/invoices");

    // Redirect to the invoices page
    redirect("/dashboard/invoices");
  }

  // Function to update an invoice

  export async function updateInvoice(id: string, formData: FormData) {

    //Connect to the database
    const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });
    //capture form data
    const rawData = Object.fromEntries(formData.entries());

    //Validate form data with Zod
    const FormSchema = z.object({
      id: z.string(),
      customerId: z.string(),
      amount: z.coerce.number(),
      status: z.enum(["pending", "paid"]),
      date: z.string(),
    });

    //omit id and date from the schema
    const UpdateInvoiceSchema = FormSchema.omit({ id: true, date: true });

    //Parse the form data
    const { customerId, amount, status } = UpdateInvoiceSchema.parse(rawData);
    //Convert amount to cents
    const amountInCents = amount * 100;

    //update the invoice in the database
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}`;

    //Revalidate the invoices cache
    revalidatePath("/dashboard/invoices");

    // Redirect to the invoices page
    redirect("/dashboard/invoices");
  }

  // Function to delete an invoice
  export async function deleteInvoice(id: string) {


    //Delete the invoice from the database
    await sql`
      DELETE FROM invoices
      WHERE id = ${id}`;

    //Revalidate the invoices cache
    revalidatePath("/dashboard/invoices");
  }