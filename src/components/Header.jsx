export default function Header({ branchName }) {
  return (
    <header className="text-center pt-10 pb-6 mb-2 lg:pt-16 lg:pb-10 lg:mb-4">
      <img
        src="/images/logo.png"
        alt="Pizzazi Logo"
        className="w-24 h-24 lg:w-32 lg:h-32 object-contain mx-auto mb-3 drop-shadow-2xl"
      />
      <h1 className="text-white text-4xl lg:text-5xl font-black tracking-widest drop-shadow-lg">
        PIZZAZI
      </h1>
      {branchName && (
        <p className="text-gray-400 text-base lg:text-lg font-semibold tracking-wide mt-1">
          {branchName}
        </p>
      )}
    </header>
  );
}
