exports.getActiveRun = async (req, res) => {
  res.status(200).json({ message: 'Active run placeholder' });
};

exports.handleNotFound = async (req, res) => {
  res.status(200).json({ message: 'Not found item handled placeholder' });
};
