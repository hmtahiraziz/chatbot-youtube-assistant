const AnswerBox = ({ answer }) => {
  if (!answer) return null;

  return (
    <div className="w-full max-w-md mt-6 bg-white p-4 rounded-lg shadow">
      <h2 className="font-semibold mb-2">Answer:</h2>
      <p className="text-gray-700 whitespace-pre-line">{answer}</p>
    </div>
  );
};

export default AnswerBox;
