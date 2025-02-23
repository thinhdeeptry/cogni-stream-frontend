import DiscussionSection from "@/components/discussion";

export default function DiscussionTest() {
  const threadId = "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11";
  return (
    <div>
      <h1>Discussion</h1>
      <p>This is a test page for discussion.</p>
      <div className="max-w-[500px] ml-auto">
        <DiscussionSection
          threadId={threadId}
          currentUserId="97017806-520f-45ef-9fe9-90e7daf39e54"
        />
      </div>
    </div>
  );
}
