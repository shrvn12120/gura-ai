// import { db } from "./db";


// type SaveChatContextParams = {

//   sessionId: string;

//   query: string;

//   results: any;

// };



// export async function getChatContext(
//   sessionId: string
// ) {

//   const result = await db.query(
//     `
//     SELECT *
//     FROM chat_context
//     WHERE session_id = $1
//       AND updated_at > NOW() - INTERVAL '30 minutes'
//     LIMIT 1
//     `,
//     [sessionId]
//   );


//   if (result.rows.length === 0) {
//     return null;
//   }


//   const context = result.rows[0];
//   return context.results;
// }





// export async function saveChatContext({

//   sessionId,

//   query,

//   results,

// }:SaveChatContextParams) {



//   await db.query(
//     `
//     INSERT INTO chat_context
//     (
//       session_id,
//       last_query,
//       results,
//       updated_at
//     )

//     VALUES
//     (
//       $1,
//       $2,
//       $3,
//       NOW()
//     )


//     ON CONFLICT(session_id)

//     DO UPDATE SET

//       last_query = EXCLUDED.last_query,

//       results = EXCLUDED.results,

//       updated_at = NOW()

//     `,
//     [

//       sessionId,

//       query,

//       JSON.stringify(results)

//     ]
//   );


// }





// export async function deleteChatContext(
//   sessionId:string
// ) {


//   await db.query(
//     `
//     DELETE FROM chat_context

//     WHERE session_id = $1

//     `,
//     [
//       sessionId
//     ]
//   );


// }

import { db } from "./db";

type SaveChatContextParams = {
  sessionId: string;
  query: string;
  results: any;
};

export async function getChatContext(
  sessionId: string,
) {
  const result =
    await db.query(
      `
      SELECT
        session_id,
        last_query,
        results,
        updated_at
      FROM chat_context
      WHERE session_id = $1
        AND updated_at >
          NOW() - INTERVAL '30 minutes'
      LIMIT 1
      `,
      [sessionId],
    );

  if (
    result.rows.length === 0
  ) {
    return null;
  }

  const row =
    result.rows[0];

  return {
    sessionId:
      row.session_id,

    lastQuery:
      row.last_query,

    results:
      row.results,

    updatedAt:
      row.updated_at,
  };
}

export async function saveChatContext({
  sessionId,
  query,
  results,
}: SaveChatContextParams) {
  await db.query(
    `
    INSERT INTO chat_context (
      session_id,
      last_query,
      results,
      updated_at
    )
    VALUES (
      $1,
      $2,
      $3,
      NOW()
    )
    ON CONFLICT (session_id)
    DO UPDATE SET
      last_query =
        EXCLUDED.last_query,

      results =
        EXCLUDED.results,

      updated_at =
        NOW()
    `,
    [
      sessionId,
      query,
      JSON.stringify(results),
    ],
  );
}

export async function deleteChatContext(
  sessionId: string,
) {
  await db.query(
    `
    DELETE FROM chat_context
    WHERE session_id = $1
    `,
    [sessionId],
  );
}