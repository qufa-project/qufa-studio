const config = {
  aws: {
    accessKeyId: process.env.ACCESS_KEY_ID || "",
    secretAccessKey: process.env.SECRET_ACCESS_KEY || "",
    region: process.env.REGION || "ap-northeast-2",
  },
  mkfeat: {
    url: process.env.FEAT_URL || "",
  },
  profiler: {
    baseUrl: process.env.PROFILER_URL || "",
  },
  imputation: {
    baseUrl: process.env.IMPUTATION_URL || "",
    token: process.env.IMPUTATION_TOKEN || "",
  },
  fairness: {
    baseUrl: process.env.FAIRNESS_URL || "",
    token: process.env.FAIRNESS_TOKEN || "",
  },
  dimReduction: {
    baseUrl: process.env.DIM_REDUCTION_URL || "",
    token: process.env.DIM_REDUCTION_TOKEN || "",
  },
};
module.exports = config;
