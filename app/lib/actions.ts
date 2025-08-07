    "use server";  
  
import postgres from "postgres";
 import { revalidatePath } from "next/cache";
 import { z } from "zod";
import { redirect } from "next/navigation";
import { AuthError } from 'next-auth';
import { signIn } from "../auth";

  export type State = {
    errors: {

      customerId?: string[];
      amount?: string[];
      status?: string[];
    },
    message: string | null;
  }

  //Connect to the database
    const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });
  
  export async function createInvoice(prevState: State, formData: FormData){


    const rawFormData = {
      customerId: formData.get("customerId"),
      amount: formData.get("amount"),
      status: formData.get("status"),
    };
    // validate form data with zod
    const FormSchema = z.object({
      id: z.string(),
      customerId: z.string({
        invalid_type_error: "Please select a customer"
      }),
      amount: z.coerce.number().gt(0, {
        message: "Please enter a valid amount"}),

      status: z.enum(["pending", "paid"], {
        message: "Please select an invoice status"}),
      date: z.string(),
    });

    const CreateInvoive = FormSchema.omit({ id: true, date: true });

    const validatedFields = CreateInvoive.safeParse(rawFormData);

    //Check if the form data is valid{
    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Please fix the errors in the form",
      };
    }
    
    //Extract the validated data
    const { customerId, amount, status } = validatedFields.data;

    //Convert amount to cents
    const amountInCents = amount * 100;
    //Add date in ISO format
    const date = new Date().toISOString().split("T")[0];


    //Insert the invoice into the database
    try {
      await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})`;

    } catch (error) {
      return {
        errors: {},
        message: "Database Error: Failed to create invoice," + error,
      };
    }

    //Revalidate the invoices cache
    revalidatePath("/dashboard/invoices");

    // Redirect to the invoices page
    redirect("/dashboard/invoices");
  }

  // Function to update an invoice

  export async function updateInvoice(id: string, prevState: State, formData: FormData) {

    //Connect to the database
    const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });
    //capture form data
    const rawData = Object.fromEntries(formData.entries());

    //Validate form data with Zod
    const FormSchema = z.object({
      id: z.string(),
      customerId: z.string(
        {
          invalid_type_error: "Please select a customer",
        }
      ),
      amount: z.coerce.number().gt(0, {
        message: "Please enter a valid amount"}),
      status: z.enum(["pending", "paid"], {
        message: "Please select an invoice status"}),
      date: z.string(),
    });

    //omit id and date from the schema
    const UpdateInvoiceSchema = FormSchema.omit({ id: true, date: true });

    //Parse the form data
    const validatedFields = UpdateInvoiceSchema.safeParse(rawData);

    //Check if the form data is valid
    if (!validatedFields.success) {
      return {
        // ...prevState,
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Please fix the errors in the form",
      };
    }

    //Extract the validated data
    const { customerId, amount, status } = validatedFields.data;
  
    //Convert amount to cents
    const amountInCents = amount * 100;

    //update the invoice in the database
    try {
      await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}`;
      
    } catch (error) {
      return {
        // ...prevState,
        errors: {},
        message: "Database Error: Failed to update invoice," + error
      };
      
    }

    //Revalidate the invoices cache
    revalidatePath("/dashboard/invoices");

    // Redirect to the invoices page
    redirect("/dashboard/invoices");
  }

  // Function to delete an invoice
  export async function deleteInvoice(id: string) {
    // throw new Error("Failed to delete invoice");

    //Delete the invoice from the database
    await sql`
      DELETE FROM invoices
      WHERE id = ${id}`;

    //Revalidate the invoices cache
    revalidatePath("/dashboard/invoices");

    
  }


  export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}