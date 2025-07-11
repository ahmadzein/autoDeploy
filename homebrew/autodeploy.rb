class Autodeploy < Formula
  desc "Local deployment automation tool with CLI and optional GUI"
  homepage "https://github.com/ahmadzein/autoDeploy"
  url "https://github.com/ahmadzein/autoDeploy/archive/refs/tags/v1.1.0.tar.gz"
  sha256 "d53e6a6d8e55032df9093b6582ee741bc7c99a9b3433255d110ca991a3e7e508"
  license "MIT"

  depends_on "node"
  depends_on "pnpm"

  option "with-gui", "Install GUI application alongside CLI"
  option "cli-only", "Install only the CLI (deprecated: CLI is installed by default)"

  def install
    system "pnpm", "install"
    
    # Install CLI
    libexec.install Dir["*"]
    bin.install_symlink libexec/"src/cli/interface.js" => "autodeploy"
    
    # Make the CLI executable
    chmod 0755, libexec/"src/cli/interface.js"
  end

  def post_install
    if build.with? "gui"
      ohai "Installing AutoDeploy GUI..."
      system "brew", "install", "--cask", "ahmadzein/autodeploy/autodeploy-gui"
    end
  end

  def caveats
    if build.with? "gui"
      <<~EOS
        AutoDeploy CLI and GUI have been installed!
        
        To start the GUI:
          autodeploy gui
          
        Or launch from Applications folder.
      EOS
    else
      <<~EOS
        AutoDeploy CLI has been installed!
        
        To get started:
          autodeploy add-project
        
        To install the GUI version later:
          brew install --cask ahmadzein/autodeploy/autodeploy-gui
          
        Documentation: https://github.com/ahmadzein/autoDeploy
      EOS
    end
  end

  test do
    system "#{bin}/autodeploy", "--version"
  end
end