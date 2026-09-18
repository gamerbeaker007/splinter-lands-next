"use client";

import { getSplMaintenanceStatus } from "@/lib/backend/actions/auth-actions";
import { useAuth } from "@/lib/frontend/context/AuthContext";
import { formatError } from "@/lib/frontend/errorFormat";
import {
  getSigner,
  HiveAuthSigner,
  useSigner,
  type Signer,
  type SignerKind,
} from "@/lib/frontend/signing";
import { Construction, Logout as LogoutIcon } from "@mui/icons-material";
import {
  Alert,
  AlertTitle,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Image from "next/image";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

interface LoginComponentProps {
  compact?: boolean;
}

export default function LoginComponent({
  compact = false,
}: LoginComponentProps) {
  const { user, loading: authLoading, clearError, login, logout } = useAuth();
  const { kind, setKind } = useSigner();

  // Separate loading states
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [error, setError] = useState<Error | null>(null);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [signingInProgress, setSigningInProgress] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [hiveAuthWait, setHiveAuthWait] = useState<{
    qr: string;
    deepLink: string;
    expire?: number;
  } | null>(null);
  const [hiveAuthQr, setHiveAuthQr] = useState<string | null>(null);
  const [hiveAuthStep, setHiveAuthStep] = useState<"scan" | "approved" | null>(
    null
  );

  const normalizeLoginError = (value: unknown): Error => {
    const message = formatError(value).trim() || "Sign-in failed.";
    return new Error(message);
  };

  useEffect(() => {
    let cancelled = false;
    if (!hiveAuthWait) {
      setHiveAuthQr(null);
      return () => {
        cancelled = true;
      };
    }

    QRCode.toDataURL(hiveAuthWait.qr, { width: 240 })
      .then((url) => {
        if (!cancelled) setHiveAuthQr(url);
      })
      .catch(() => {
        if (!cancelled) setHiveAuthQr(null);
      });

    return () => {
      cancelled = true;
    };
  }, [hiveAuthWait]);

  const handleLoginClick = (event: React.MouseEvent<HTMLElement>) => {
    if (user) {
      setAnchorEl(event.currentTarget);
    } else {
      setLoginDialogOpen(true);
    }
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
  };

  const handleDialogClose = () => {
    setLoginDialogOpen(false);
    setUsername("");
    setError(null);
    setIsMaintenance(false);
    clearError();
    setSigningInProgress(false);
    setHiveAuthWait(null);
    setHiveAuthStep(null);
  };

  const handleLogin = async (
    loginKind: SignerKind = kind,
    loginSigner: Signer = getSigner(loginKind)
  ) => {
    if (!username.trim()) {
      setError(new Error("Please enter a username"));
      return;
    }

    setError(null);
    setIsMaintenance(false);
    setSigningInProgress(true);
    setHiveAuthWait(null);
    setHiveAuthStep(loginKind === "hiveauth" ? "scan" : null);

    try {
      if (loginKind === "hiveauth") {
        if (!(loginSigner instanceof HiveAuthSigner)) {
          throw new Error("HiveAuth signer is unavailable");
        }
        const timestamp = Date.now();
        const account = username.toLowerCase();
        const message = `${account}${timestamp}`;
        const signature = await loginSigner.connectAndSign(
          username,
          message,
          (wait) => {
            setHiveAuthStep("scan");
            setHiveAuthWait(wait);
          }
        );
        setHiveAuthStep("approved");
        await login(account, timestamp, signature);
      } else {
        await login(username.toLowerCase());
      }
      handleDialogClose();
    } catch (err) {
      setError(normalizeLoginError(err));
      setHiveAuthStep(null);
      setHiveAuthWait(null);
      getSplMaintenanceStatus().then(({ maintenance }) =>
        setIsMaintenance(maintenance)
      );
    } finally {
      setSigningInProgress(false);
    }
  };

  const hiveAuthPanel =
    kind === "hiveauth" && hiveAuthStep === "scan" && hiveAuthWait ? (
      <Stack spacing={1} alignItems="center">
        {hiveAuthQr && (
          <Box
            component="img"
            src={hiveAuthQr}
            alt="HiveAuth approval QR code"
            sx={{ width: 240, height: 240, maxWidth: "100%" }}
          />
        )}
        <Button
          component="a"
          href={hiveAuthWait.deepLink}
          target="_blank"
          rel="noreferrer"
          variant="outlined"
          size="small"
        >
          Open HiveAuth on this phone
        </Button>
        {hiveAuthWait.expire && (
          <Typography variant="caption" color="text.secondary">
            Request expires at{" "}
            {new Date(hiveAuthWait.expire).toLocaleTimeString()}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Scan the code or open the link on your phone, then approve in your
          wallet
        </Typography>
      </Stack>
    ) : null;

  const signerButtons = (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
      <Button
        onClick={() => {
          setKind("keychain");
          void handleLogin("keychain", getSigner("keychain"));
        }}
        variant={kind === "keychain" ? "contained" : "outlined"}
        size="large"
        disabled={signingInProgress || !username.trim()}
        fullWidth
        sx={{
          p: 0,
          minHeight: 48,
          minWidth: 120,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Image
          src="/images/HiveKeychainInlogButton.png"
          alt="Sign In with Keychain"
          fill
          sizes="(max-width: 600px) 100vw, 120px"
          style={{
            objectFit: "contain",
            opacity: signingInProgress || !username.trim() ? 0.5 : 1,
          }}
        />
      </Button>
      <Button
        onClick={() => {
          setKind("hiveauth");
          void handleLogin("hiveauth", getSigner("hiveauth"));
        }}
        variant={kind === "hiveauth" ? "contained" : "outlined"}
        size="large"
        disabled={signingInProgress || !username.trim()}
        fullWidth
        sx={{ minHeight: 48, textTransform: "none" }}
      >
        <Image
          src="/images/HiveAuthLoginButton.png"
          alt="Sign In with HiveAuth"
          fill
          sizes="(max-width: 600px) 100vw, 120px"
          style={{
            objectFit: "cover",
            opacity: signingInProgress || !username.trim() ? 0.5 : 1,
          }}
        />
      </Button>
    </Stack>
  );

  // Show loading state from useAuth on initial app load
  if (authLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          p: 1,
        }}
      >
        <CircularProgress size={20} />
      </Box>
    );
  }

  if (compact) {
    return (
      <>
        {user?.username ? (
          <Tooltip title={user.username}>
            <Box
              onClick={handleLoginClick}
              sx={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                p: 0.5,
                borderRadius: 1,
                outline: "none",
                "&:hover": { backgroundColor: "action.hover" },
                "&:focus": { boxShadow: "none", outline: "none" },
              }}
              tabIndex={0}
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                <Image
                  src={`https://images.hive.blog/u/${user.username}/avatar`}
                  alt={user.username}
                  width={32}
                  height={32}
                />
              </Avatar>
            </Box>
          </Tooltip>
        ) : (
          <Tooltip title="Sign In">
            <IconButton onClick={handleLoginClick} size="small">
              <Image
                src="/images/Splinterlands.avif"
                alt="Sign In"
                width={24}
                height={24}
              />
            </IconButton>
          </Tooltip>
        )}

        {/* User Menu (when logged in) */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <MenuItem onClick={handleLogout}>
            <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
            Logout
          </MenuItem>
        </Menu>

        {/* Login Dialog */}
        <Dialog
          open={loginDialogOpen}
          onClose={handleDialogClose}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
            >
              Sign in with your Hive account using{" "}
              {kind === "keychain" ? "Keychain" : "HiveAuth"}
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                label="Hive Username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                disabled={signingInProgress}
                fullWidth
                autoFocus
                placeholder="Enter your Hive username"
              />
              {(error?.message || isMaintenance) && (
                <Alert
                  severity={isMaintenance ? "warning" : "error"}
                  variant="outlined"
                  icon={
                    isMaintenance ? (
                      <Construction fontSize="inherit" />
                    ) : undefined
                  }
                >
                  {isMaintenance ? (
                    <>
                      <AlertTitle>
                        Splinterlands is under maintenance
                      </AlertTitle>
                      The game API is temporarily unavailable. Please try again
                      later.
                    </>
                  ) : (
                    error?.message || "Sign-in failed."
                  )}
                </Alert>
              )}
              {signingInProgress &&
                (kind === "keychain" || hiveAuthStep === "approved") && (
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="text.secondary">
                      {kind === "keychain"
                        ? "Waiting for Keychain approval..."
                        : "Approved on your phone. Signing in…"}
                    </Typography>
                  </Stack>
                )}
              {hiveAuthPanel}
              {signerButtons}
            </Stack>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      {user?.username ? (
        <Box
          onClick={handleLoginClick}
          sx={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 1,
            p: 1,
            borderRadius: 1,
            outline: "none",
            "&:hover": {
              backgroundColor: "action.hover",
            },
            "&:focus": {
              boxShadow: "none",
              outline: "none",
            },
          }}
          tabIndex={0}
        >
          <Avatar sx={{ width: 32, height: 32 }}>
            <Image
              src={`https://images.hive.blog/u/${user.username}/avatar`}
              alt={user.username}
              width={32}
              height={32}
            />
          </Avatar>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {user.username}
          </Typography>
        </Box>
      ) : (
        <Button
          onClick={handleLoginClick}
          variant="outlined"
          startIcon={
            <Image
              src={"/images/Splinterlands.avif"}
              alt=""
              width={20}
              height={20}
            />
          }
          sx={{ textTransform: "none" }}
        >
          Sign In
        </Button>
      )}

      {/* User Menu (when logged in) */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem onClick={handleLogout}>
          <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
          Logout
        </MenuItem>
      </Menu>

      {/* Login Dialog (when not logged in) */}
      <Dialog
        open={loginDialogOpen}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Sign in with your Hive account using{" "}
            {kind === "keychain" ? "Keychain" : "HiveAuth"}
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Hive Username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              disabled={signingInProgress}
              fullWidth
              autoFocus
              placeholder="Enter your Hive username"
            />

            {(error?.message || isMaintenance) && (
              <Alert
                severity={isMaintenance ? "warning" : "error"}
                variant="outlined"
                icon={
                  isMaintenance ? (
                    <Construction fontSize="inherit" />
                  ) : undefined
                }
              >
                {isMaintenance ? (
                  <>
                    <AlertTitle>Splinterlands is under maintenance</AlertTitle>
                    The game API is temporarily unavailable. Please try again
                    later.
                  </>
                ) : (
                  error?.message || "Sign-in failed."
                )}
              </Alert>
            )}

            {signingInProgress &&
              (kind === "keychain" || hiveAuthStep === "approved") && (
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  justifyContent="center"
                >
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="text.secondary">
                    {kind === "keychain"
                      ? "Waiting for Keychain approval..."
                      : "Approved on your phone. Signing in…"}
                  </Typography>
                </Stack>
              )}
            {hiveAuthPanel}
            {signerButtons}
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}
