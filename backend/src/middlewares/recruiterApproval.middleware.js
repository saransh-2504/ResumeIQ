// Check if recruiter has been approved by admin
// This runs AFTER authMiddleware and roleMiddleware
export function recruiterApprovalMiddleware(req, res, next) {
  if (req.user.role === "recruiter" && !req.user.isApproved) {
    return res.status(403).json({
      message: "Your recruiter account is pending admin approval.",
    });
  }
  next();
}
