require("dotenv").config({ path: ".env.local" }); // Add this line at the top

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use the service role key!
);

async function main() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: "dev@local.test",
    password: "devpassword123",
    email_confirm: true,
  });

  if (error) {
    console.error("Error creating user:", error);
  } else {
    console.log("User created:", data.user);
  }
}

main();
