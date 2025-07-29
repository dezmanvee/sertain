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